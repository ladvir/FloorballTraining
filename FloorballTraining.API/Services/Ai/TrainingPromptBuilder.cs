using System.Text;
using System.Text.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services.Ai;

/// <summary>One activity offered to the model as building material for the draft.</summary>
public record ActivityCandidate(
    int Id,
    string Name,
    string? Description,
    int DurationMin,
    int DurationMax,
    int PersonsMin,
    int PersonsMax,
    int Intensity,
    List<string> Tags);

/// <summary>
/// Prompt grounding for AI training generation: the model only composes from real
/// activities passed in the prompt (top-N by goal-tag overlap), and every activity id
/// it returns is validated against that candidate set — hallucinated ids are dropped
/// with a warning, never saved.
/// </summary>
public static class TrainingPromptBuilder
{
    public const int MaxCandidates = 50;
    private const int MaxDescriptionLength = 200;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    // ── Candidate selection ──────────────────────────────────────────────────

    public static async Task<List<ActivityCandidate>> SelectCandidatesAsync(
        FloorballTrainingContext context,
        TrainingGenerationRequest request,
        CancellationToken cancellationToken)
    {
        var activities = await context.Activities
            .Where(a => !a.IsDraft)
            .Where(a => a.ActivityAgeGroups.Count == 0
                        || a.ActivityAgeGroups.Any(ag =>
                            ag.AgeGroupId == request.AgeGroupId
                            || (ag.AgeGroup != null && ag.AgeGroup.Name == AgeGroup.AnyAge)))
            .Select(a => new
            {
                a.Id,
                a.Name,
                a.Description,
                a.DurationMin,
                a.DurationMax,
                a.PersonsMin,
                a.PersonsMax,
                a.Intensity,
                TagIds = a.ActivityTags
                    .Where(at => at.TagId != null)
                    .Select(at => at.TagId!.Value)
                    .ToList(),
                TagNames = a.ActivityTags
                    .Where(at => at.Tag != null)
                    .Select(at => at.Tag!.Name)
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        var goalTags = request.GoalTagIds.ToHashSet();

        return activities
            .Select(a => new
            {
                Activity = a,
                // Goal-tag overlap first, then activities that at least fit the head count.
                Score = a.TagIds.Count(goalTags.Contains) * 100
                        + (a.PersonsMin <= request.PersonsMax && a.PersonsMax >= request.PersonsMin ? 10 : 0)
            })
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Activity.Id)
            .Take(MaxCandidates)
            .Select(x => new ActivityCandidate(
                x.Activity.Id,
                x.Activity.Name,
                Truncate(x.Activity.Description),
                x.Activity.DurationMin,
                x.Activity.DurationMax,
                x.Activity.PersonsMin,
                x.Activity.PersonsMax,
                x.Activity.Intensity,
                x.Activity.TagNames))
            .ToList();
    }

    private static string? Truncate(string? text) =>
        string.IsNullOrEmpty(text) || text.Length <= MaxDescriptionLength
            ? text
            : text[..MaxDescriptionLength] + "…";

    // ── Prompts ──────────────────────────────────────────────────────────────

    public static string BuildSystemPrompt() =>
        "Jsi expert na florbalový trénink mládeže i dospělých. Sestavuješ tréninkové " +
        "jednotky výhradně z aktivit, které dostaneš v seznamu — každá má číselné id. " +
        "Odpovídej POUZE jedním JSON objektem bez jakéhokoliv dalšího textu, ve tvaru:\n" +
        "{\"name\": string, \"description\": string, \"parts\": [{\"name\": string, " +
        "\"description\": string, \"duration\": number, \"activities\": [{\"activityId\": number}]}]}\n" +
        "Pravidla:\n" +
        "- activityId MUSÍ být id ze zadaného seznamu aktivit; žádná jiná id si nevymýšlej.\n" +
        "- Součet duration všech částí se musí co nejvíce blížit požadované délce tréninku.\n" +
        "- Trénink má mít rozcvičení/úvod, hlavní část zaměřenou na cíle a závěr.\n" +
        "- Respektuj počet hráčů a intenzitu. Texty piš česky.";

    public static string BuildUserPrompt(
        TrainingGenerationRequest request,
        IReadOnlyList<ActivityCandidate> candidates,
        IReadOnlyList<string> goalTagNames,
        string ageGroupName,
        IReadOnlyList<string> equipmentNames)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Sestav trénink podle zadání:");
        sb.AppendLine($"- cíle: {(goalTagNames.Count > 0 ? string.Join(", ", goalTagNames) : "všestranný rozvoj")}");
        sb.AppendLine($"- věková kategorie: {ageGroupName}");
        sb.AppendLine($"- délka: {request.DurationMinutes} minut");
        sb.AppendLine($"- počet hráčů: {request.PersonsMin}–{request.PersonsMax}");
        if (request.Intensity.HasValue)
            sb.AppendLine($"- intenzita (1–10): {request.Intensity.Value}");
        if (equipmentNames.Count > 0)
            sb.AppendLine($"- dostupné vybavení: {string.Join(", ", equipmentNames)}");
        if (!string.IsNullOrWhiteSpace(request.Notes))
            sb.AppendLine($"- poznámka trenéra: {request.Notes}");
        sb.AppendLine();
        sb.AppendLine("Dostupné aktivity (JSON, jedna na řádek):");
        foreach (var c in candidates)
        {
            sb.AppendLine(JsonSerializer.Serialize(new
            {
                id = c.Id,
                name = c.Name,
                desc = c.Description,
                durMin = c.DurationMin,
                durMax = c.DurationMax,
                pMin = c.PersonsMin,
                pMax = c.PersonsMax,
                intensity = c.Intensity,
                tags = c.Tags
            }, Json));
        }
        return sb.ToString();
    }

    // ── Model output parsing + validation ────────────────────────────────────

    /// <summary>Pulls the first JSON object out of the model text (code-fence tolerant).</summary>
    public static string? ExtractJson(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var start = text.IndexOf('{');
        if (start < 0) return null;

        // Walk to the matching closing brace, ignoring braces inside strings.
        var depth = 0;
        var inString = false;
        for (var i = start; i < text.Length; i++)
        {
            var ch = text[i];
            if (inString)
            {
                if (ch == '\\') i++;
                else if (ch == '"') inString = false;
                continue;
            }
            switch (ch)
            {
                case '"': inString = true; break;
                case '{': depth++; break;
                case '}':
                    depth--;
                    if (depth == 0) return text[start..(i + 1)];
                    break;
            }
        }
        return null;
    }

    private sealed class RawDraft
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public List<RawPart>? Parts { get; set; }
    }

    private sealed class RawPart
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int Duration { get; set; }
        public List<RawActivity>? Activities { get; set; }
    }

    private sealed class RawActivity
    {
        public int ActivityId { get; set; }
    }

    /// <summary>
    /// Parses the accumulated model text and builds a validated draft. Activity ids
    /// outside the candidate set are dropped (warning "unknownActivity"); a large gap
    /// between requested and drafted duration adds "durationMismatch". Returns an
    /// error code instead of a draft when no usable JSON came back.
    /// </summary>
    public static (TrainingDraftDto? Draft, List<AiDraftWarningDto> Warnings, string? Error) ParseAndValidate(
        string modelText,
        TrainingGenerationRequest request,
        IReadOnlyList<ActivityCandidate> candidates)
    {
        var warnings = new List<AiDraftWarningDto>();

        var json = ExtractJson(modelText);
        if (json == null)
            return (null, warnings, "noJson");

        RawDraft? raw;
        try
        {
            raw = JsonSerializer.Deserialize<RawDraft>(json, Json);
        }
        catch (JsonException)
        {
            return (null, warnings, "invalidJson");
        }

        if (raw?.Parts == null || raw.Parts.Count == 0)
            return (null, warnings, "emptyDraft");

        var candidateById = candidates.ToDictionary(c => c.Id);
        var draft = new TrainingDraftDto
        {
            Name = string.IsNullOrWhiteSpace(raw.Name) ? "AI trénink" : raw.Name.Trim(),
            Description = raw.Description,
            PersonsMin = request.PersonsMin,
            PersonsMax = request.PersonsMax,
            Intensity = request.Intensity,
            AgeGroupId = request.AgeGroupId,
            GoalTagIds = request.GoalTagIds
        };

        foreach (var rawPart in raw.Parts)
        {
            var part = new TrainingDraftPartDto
            {
                Name = string.IsNullOrWhiteSpace(rawPart.Name) ? $"Část {draft.Parts.Count + 1}" : rawPart.Name.Trim(),
                Description = rawPart.Description,
                Duration = Math.Max(0, rawPart.Duration)
            };
            foreach (var rawActivity in rawPart.Activities ?? [])
            {
                if (candidateById.TryGetValue(rawActivity.ActivityId, out var candidate))
                    part.Activities.Add(new TrainingDraftActivityDto
                    {
                        ActivityId = candidate.Id,
                        ActivityName = candidate.Name
                    });
                else
                    warnings.Add(new AiDraftWarningDto
                    {
                        Code = "unknownActivity",
                        Value = rawActivity.ActivityId.ToString()
                    });
            }
            draft.Parts.Add(part);
        }

        if (draft.Parts.All(p => p.Activities.Count == 0))
            return (null, warnings, "emptyDraft");

        draft.Duration = draft.Parts.Sum(p => p.Duration);
        if (draft.Duration == 0)
            draft.Duration = request.DurationMinutes;
        else if (Math.Abs(draft.Duration - request.DurationMinutes) > request.DurationMinutes * 0.2)
            warnings.Add(new AiDraftWarningDto { Code = "durationMismatch", Value = draft.Duration.ToString() });

        return (draft, warnings, null);
    }
}
