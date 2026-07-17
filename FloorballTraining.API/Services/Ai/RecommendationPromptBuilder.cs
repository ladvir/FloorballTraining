using System.Text;
using System.Text.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services.Ai;

/// <summary>
/// AI development recommendations for the player report (Feat15 #48, etapa #74).
/// Same grounding contract as training generation: the model only references
/// candidate activities and every returned id is validated server-side. The prompt
/// deliberately carries NO personal identifiers — only age, gender and performance
/// aggregates (GDPR).
/// </summary>
public static class RecommendationPromptBuilder
{
    public const int MaxCandidates = 40;
    private const int MaxDescriptionLength = 200;
    private const int MaxRecommendations = 5;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static async Task<List<ActivityCandidate>> SelectCandidatesAsync(
        FloorballTrainingContext context,
        IReadOnlyCollection<int> memberAgeGroupIds,
        CancellationToken cancellationToken)
    {
        var activities = await context.Activities
            .Where(a => !a.IsDraft)
            .Where(a => a.ActivityAgeGroups.Count == 0
                        || a.ActivityAgeGroups.Any(ag =>
                            (ag.AgeGroup != null && ag.AgeGroup.Name == AgeGroup.AnyAge)
                            || (ag.AgeGroupId != null && memberAgeGroupIds.Contains(ag.AgeGroupId.Value))))
            .OrderBy(a => a.Id)
            .Take(MaxCandidates)
            .Select(a => new ActivityCandidate(
                a.Id,
                a.Name,
                a.Description,
                a.DurationMin,
                a.DurationMax,
                a.PersonsMin,
                a.PersonsMax,
                a.Intensity,
                a.ActivityTags
                    .Where(at => at.Tag != null)
                    .Select(at => at.Tag!.Name)
                    .ToList()))
            .ToListAsync(cancellationToken);

        return activities
            .Select(a => a with
            {
                Description = a.Description != null && a.Description.Length > MaxDescriptionLength
                    ? a.Description[..MaxDescriptionLength] + "…"
                    : a.Description
            })
            .ToList();
    }

    public static string BuildSystemPrompt() =>
        "Jsi expert na rozvoj florbalových hráčů. Na základě výkonnostního profilu hráče " +
        "navrhni 3 až 5 konkrétních doporučení pro trénink. Ke každému doporučení vyber " +
        "1–3 vhodné aktivity POUZE ze zadaného seznamu (odkazuj se jejich číselným id). " +
        "Odpovídej POUZE jedním JSON objektem bez dalšího textu, ve tvaru:\n" +
        "{\"recommendations\":[{\"title\": string, \"rationale\": string, \"activityIds\": [number]}]}\n" +
        "Texty piš česky, stručně a prakticky pro trenéra. Zaměř se hlavně na slabé stránky.";

    public static string BuildUserPrompt(PlayerReportDto report, IReadOnlyList<ActivityCandidate> candidates)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Profil hráče (anonymizovaný):");
        sb.AppendLine($"- věk: {report.Member.Age}, pohlaví: {report.Member.Gender switch { 0 => "muž", 1 => "žena", _ => "neuvedeno" }}");
        if (report.Member.Position != null)
            sb.AppendLine($"- obvyklá pozice: {report.Member.Position}");
        sb.AppendLine($"- kanadské bodování za 12 měsíců: {report.Scoring.Goals}G + {report.Scoring.Assists}A = {report.Scoring.Points} bodů v {report.Scoring.Games} zápasech");
        if (report.Attendance.Pct.HasValue)
            sb.AppendLine($"- docházka: {report.Attendance.Pct:0.#} %");
        if (report.Workouts.Assigned > 0)
            sb.AppendLine($"- plnění individuálních úkolů: {report.Workouts.Completed}/{report.Workouts.Assigned}");

        if (report.Weaknesses.Count > 0)
        {
            sb.AppendLine("Slabé stránky (testy):");
            foreach (var w in report.Weaknesses)
                sb.AppendLine($"- {w.Name}: {w.LatestValue:0.##} {w.Unit} (pásmo výborné: {w.BenchmarkText ?? "?"}, barva: {w.Colour}, trend: {TrendText(w.Trend)})");
        }
        if (report.Strengths.Count > 0)
        {
            sb.AppendLine("Silné stránky (testy):");
            foreach (var s in report.Strengths)
                sb.AppendLine($"- {s.Name}: {s.LatestValue:0.##} {s.Unit}");
        }

        sb.AppendLine();
        sb.AppendLine("Dostupné aktivity (JSON, jedna na řádek):");
        foreach (var c in candidates)
        {
            sb.AppendLine(JsonSerializer.Serialize(new
            {
                id = c.Id,
                name = c.Name,
                desc = c.Description,
                intensity = c.Intensity,
                tags = c.Tags
            }, Json));
        }
        return sb.ToString();
    }

    private static string TrendText(int? trend) => trend switch
    {
        1 => "zlepšuje se",
        -1 => "zhoršuje se",
        0 => "stagnuje",
        _ => "neznámý",
    };

    private sealed class RawRecommendations
    {
        public List<RawRecommendation>? Recommendations { get; set; }
    }

    private sealed class RawRecommendation
    {
        public string? Title { get; set; }
        public string? Rationale { get; set; }
        public List<int>? ActivityIds { get; set; }
    }

    /// <summary>
    /// Parses the model output; hallucinated activity ids are dropped with
    /// "unknownActivity" warnings, recommendations are capped at 5. Returns an
    /// error code when no usable JSON came back.
    /// </summary>
    public static (List<AiRecommendationDto>? Recommendations, List<AiDraftWarningDto> Warnings, string? Error)
        ParseAndValidate(string modelText, IReadOnlyList<ActivityCandidate> candidates)
    {
        var warnings = new List<AiDraftWarningDto>();

        var json = TrainingPromptBuilder.ExtractJson(modelText);
        if (json == null) return (null, warnings, "noJson");

        RawRecommendations? raw;
        try
        {
            raw = JsonSerializer.Deserialize<RawRecommendations>(json, Json);
        }
        catch (JsonException)
        {
            return (null, warnings, "invalidJson");
        }

        if (raw?.Recommendations == null || raw.Recommendations.Count == 0)
            return (null, warnings, "emptyDraft");

        var candidateById = candidates.ToDictionary(c => c.Id);
        var result = new List<AiRecommendationDto>();
        foreach (var rawRecommendation in raw.Recommendations.Take(MaxRecommendations))
        {
            if (string.IsNullOrWhiteSpace(rawRecommendation.Title)) continue;

            var recommendation = new AiRecommendationDto
            {
                Title = rawRecommendation.Title.Trim(),
                Rationale = rawRecommendation.Rationale?.Trim() ?? "",
            };
            foreach (var activityId in rawRecommendation.ActivityIds ?? [])
            {
                if (candidateById.TryGetValue(activityId, out var candidate))
                    recommendation.Activities.Add(new TrainingDraftActivityDto
                    {
                        ActivityId = candidate.Id,
                        ActivityName = candidate.Name
                    });
                else
                    warnings.Add(new AiDraftWarningDto
                    {
                        Code = "unknownActivity",
                        Value = activityId.ToString()
                    });
            }
            result.Add(recommendation);
        }

        return result.Count == 0 ? (null, warnings, "emptyDraft") : (result, warnings, null);
    }
}
