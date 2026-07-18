using System.Text;
using System.Text.Json;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.API.Services.Ai;

/// <summary>Catalog entry (tag / age group / equipment) offered to the model by real id.</summary>
public record CatalogItem(int Id, string Name);

/// <summary>
/// AI activity import (etapa #78): the model drafts new floorball drills from the
/// coach's search criteria. Grounding differs from training generation — here the
/// activity CONTENT is authored by the model, but every referenced tag, age group
/// and equipment id must come from the app's catalogs and is validated server-side.
/// Nothing is persisted; the user reviews and saves via the standard activity form.
/// </summary>
public static class ActivitySuggestionPromptBuilder
{
    public const int MaxCount = 3;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static string BuildSystemPrompt() =>
        "Jsi expert na florbalový trénink a tvoříš zásobník cvičení. Podle zadaných kritérií " +
        "navrhni nová florbalová cvičení (aktivity). Každé cvičení popiš strukturovaně a prakticky " +
        "pro trenéra: organizace (rozestavění, pomůcky), průběh cvičení, varianty a na co dohlížet. " +
        "Štítky, věkové kategorie a vybavení vybírej VÝHRADNĚ ze zadaných katalogů (odkazuj se " +
        "číselnými id). Odpovídej POUZE jedním JSON objektem bez dalšího textu:\n" +
        "{\"suggestions\":[{\"name\": string, \"description\": string, \"durationMin\": number, " +
        "\"durationMax\": number, \"personsMin\": number, \"personsMax\": number, " +
        "\"tagIds\": [number], \"ageGroupIds\": [number], \"equipmentIds\": [number]}]}\n" +
        "Texty piš česky. Délky jsou v minutách.";

    public static string BuildUserPrompt(
        ActivitySuggestionRequest request,
        IReadOnlyList<CatalogItem> tags,
        IReadOnlyList<CatalogItem> ageGroups,
        IReadOnlyList<CatalogItem> equipment)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Navrhni {Math.Clamp(request.Count, 1, MaxCount)} cvičení podle kritérií:");
        sb.AppendLine(request.Criteria.Trim());
        sb.AppendLine();
        sb.AppendLine("Katalog štítků (id: název): "
                      + string.Join(", ", tags.Select(t => $"{t.Id}: {t.Name}")));
        sb.AppendLine("Katalog věkových kategorií (id: název): "
                      + string.Join(", ", ageGroups.Select(g => $"{g.Id}: {g.Name}")));
        sb.AppendLine("Katalog vybavení (id: název): "
                      + string.Join(", ", equipment.Select(e => $"{e.Id}: {e.Name}")));
        return sb.ToString();
    }

    private sealed class RawSuggestions
    {
        public List<RawSuggestion>? Suggestions { get; set; }
    }

    private sealed class RawSuggestion
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int DurationMin { get; set; }
        public int DurationMax { get; set; }
        public int PersonsMin { get; set; }
        public int PersonsMax { get; set; }
        public List<int>? TagIds { get; set; }
        public List<int>? AgeGroupIds { get; set; }
        public List<int>? EquipmentIds { get; set; }
    }

    /// <summary>
    /// Parses the model output; catalog ids outside the app's catalogs are dropped
    /// with "unknownCatalogItem" warnings, ranges are clamped to sane values and the
    /// suggestion count is capped.
    /// </summary>
    public static (List<ActivitySuggestionDto>? Suggestions, List<AiDraftWarningDto> Warnings, string? Error)
        ParseAndValidate(
            string modelText,
            IReadOnlyList<CatalogItem> tags,
            IReadOnlyList<CatalogItem> ageGroups,
            IReadOnlyList<CatalogItem> equipment)
    {
        var warnings = new List<AiDraftWarningDto>();

        var json = TrainingPromptBuilder.ExtractJson(modelText);
        if (json == null) return (null, warnings, "noJson");

        RawSuggestions? raw;
        try
        {
            raw = JsonSerializer.Deserialize<RawSuggestions>(json, Json);
        }
        catch (JsonException)
        {
            return (null, warnings, "invalidJson");
        }

        if (raw?.Suggestions == null || raw.Suggestions.Count == 0)
            return (null, warnings, "emptyDraft");

        var tagById = tags.ToDictionary(t => t.Id);
        var ageGroupById = ageGroups.ToDictionary(g => g.Id);
        var equipmentById = equipment.ToDictionary(e => e.Id);

        (List<int> Ids, List<string> Names) ResolveIds(
            IEnumerable<int>? ids, IReadOnlyDictionary<int, CatalogItem> catalog)
        {
            var resolvedIds = new List<int>();
            var resolvedNames = new List<string>();
            foreach (var id in (ids ?? []).Distinct())
            {
                if (catalog.TryGetValue(id, out var item))
                {
                    resolvedIds.Add(item.Id);
                    resolvedNames.Add(item.Name);
                }
                else
                {
                    warnings.Add(new AiDraftWarningDto { Code = "unknownCatalogItem", Value = id.ToString() });
                }
            }
            return (resolvedIds, resolvedNames);
        }

        var result = new List<ActivitySuggestionDto>();
        foreach (var rawSuggestion in raw.Suggestions.Take(MaxCount))
        {
            if (string.IsNullOrWhiteSpace(rawSuggestion.Name)
                || string.IsNullOrWhiteSpace(rawSuggestion.Description))
                continue;

            var durationMin = Math.Clamp(rawSuggestion.DurationMin, 1, 240);
            var durationMax = Math.Clamp(rawSuggestion.DurationMax, durationMin, 240);
            var personsMin = Math.Clamp(rawSuggestion.PersonsMin, 1, 99);
            var personsMax = Math.Clamp(rawSuggestion.PersonsMax, personsMin, 99);

            var (tagIds, tagNames) = ResolveIds(rawSuggestion.TagIds, tagById);
            var (ageGroupIds, ageGroupNames) = ResolveIds(rawSuggestion.AgeGroupIds, ageGroupById);
            var (equipmentIds, equipmentNames) = ResolveIds(rawSuggestion.EquipmentIds, equipmentById);

            result.Add(new ActivitySuggestionDto
            {
                Name = rawSuggestion.Name.Trim(),
                Description = rawSuggestion.Description.Trim(),
                DurationMin = durationMin,
                DurationMax = durationMax,
                PersonsMin = personsMin,
                PersonsMax = personsMax,
                TagIds = tagIds,
                TagNames = tagNames,
                AgeGroupIds = ageGroupIds,
                AgeGroupNames = ageGroupNames,
                EquipmentIds = equipmentIds,
                EquipmentNames = equipmentNames,
            });
        }

        return result.Count == 0 ? (null, warnings, "emptyDraft") : (result, warnings, null);
    }
}
