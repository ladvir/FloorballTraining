namespace FloorballTraining.CoreBusiness.Specifications;

public class ActivitiesBaseSpecification : BaseSpecification<Activity>
{
    public ActivitiesBaseSpecification(ActivitySpecificationParameters parameters, object? env = null) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (string.IsNullOrEmpty(parameters.Description) || x.Description != null && x.Description.ToLower().Contains(parameters.Description.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.PersonsMin.HasValue || x.PersonsMin >= parameters.PersonsMin) &&
            (!parameters.PersonsMax.HasValue || x.PersonsMax <= parameters.DurationMax) &&
            (!parameters.DurationMin.HasValue || x.DurationMin >= parameters.DurationMin) &&
            (!parameters.DurationMax.HasValue || x.DurationMax <= parameters.DurationMax) &&
            (!parameters.IntensityMin.HasValue || x.Intensity >= parameters.IntensityMin) &&
            (!parameters.IntensityMax.HasValue || x.Intensity <= parameters.IntensityMax) &&
            (!parameters.DifficultyMin.HasValue || x.Difficulty >= parameters.DifficultyMin) &&
            (!parameters.DifficultyMax.HasValue || x.Difficulty <= parameters.DifficultyMax) &&
            (!parameters.PlaceWidthMin.HasValue || x.PlaceWidth >= parameters.PlaceWidthMin) &&
            (!parameters.PlaceWidthMax.HasValue || x.PlaceWidth <= parameters.PlaceWidthMax) &&
            (!parameters.PlaceLengthMin.HasValue || x.PlaceLength >= parameters.PlaceLengthMin) &&
            (!parameters.PlaceLengthMax.HasValue || x.PlaceLength <= parameters.PlaceLengthMax) &&
            (!parameters.PlaceAreaMin.HasValue || (x.PlaceWidth * x.PlaceLength) >= parameters.PlaceAreaMin) &&
            (!parameters.PlaceAreaMax.HasValue || (x.PlaceWidth * x.PlaceLength) <= parameters.PlaceAreaMax) &&
            (string.IsNullOrEmpty(parameters.Environment) || (Enum.TryParse(typeof(Environment), parameters.Environment, true, out env) && x.Environment == (Environment)env)) &&

            //(string.IsNullOrEmpty(parameters.Tag) || x.ActivityTags.Exists(t => t.Tag != null && parameters.Tag.ToLower().Split(";", StringSplitOptions.TrimEntries).Contains(t.Tag.Name.ToLower())))
            (string.IsNullOrEmpty(parameters.Tag) || HasMatchingTag(x.ActivityTags.AsEnumerable(), parameters.Tag.ToLower().Split(";", StringSplitOptions.TrimEntries)))


    /*&& (string.IsNullOrEmpty(parameters.Equipment) || x.ActivityEquipments.Any(t => t.Equipment != null
        && parameters.Equipment.Split(";", StringSplitOptions.TrimEntries).Any(tt => t.Equipment.Name.ToLower().Contains(tt.ToLower())))) &&
    (string.IsNullOrEmpty(parameters.AgeGroup) || x.ActivityAgeGroups.Any(t => t.AgeGroup != null
        && parameters.AgeGroup.Split(";", StringSplitOptions.TrimEntries).Any(tt => t.AgeGroup.Name.ToLower().Contains(tt.ToLower()))))*/
    )
    {
        AddInclude(t => t.ActivityTags);
        AddInclude("ActivityTags.Tag");
        AddInclude(t => t.ActivityAgeGroups);
        AddInclude("ActivityAgeGroups.AgeGroup");
        AddInclude(t => t.ActivityEquipments);
        AddInclude("ActivityEquipments.Equipment");
        AddOrderBy(t => t.Name);
        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);
        AddSorting(parameters.Sort);
    }

    private static bool HasMatchingTag(IEnumerable<ActivityTag> activityTags, string[] tags)
    {
        var result = activityTags.Any(t => t.Tag != null && tags.Contains(t.Tag.Name.ToLower()));

        return result;
    }


    public ActivitiesBaseSpecification(int id) : base(x => x.Id == id)
    {
    }

    private void AddSorting(string? sort)
    {
        if (string.IsNullOrEmpty(sort)) return;

        switch (sort)
        {
            case "nameAsc":
                AddOrderBy(t => t.Name);
                break;
            case "nameDesc":
                AddOrderByDescending(t => t.Name);
                break;
            default:
                AddOrderBy(t => t.Id);
                break;
        }
    }
}