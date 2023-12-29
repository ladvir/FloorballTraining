﻿namespace FloorballTraining.CoreBusiness.Specifications;

public class ActivitiesForCountSpecification : BaseSpecification<Activity>
{
    public ActivitiesForCountSpecification(ActivitySpecificationParameters parameters, object? env = null) : base(
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

    //(string.IsNullOrEmpty(parameters.Tag) || x.ActivityTags.AsEnumerable().Any(t => t.Tag != null && parameters.Tag.ToLower().Split(";", StringSplitOptions.TrimEntries).AsEnumerable().Any(s => t.Tag.Name.ToLower().Contains(s)))

    (string.IsNullOrEmpty(parameters.Tag) || parameters.Tag.ToLower().Split(";", StringSplitOptions.TrimEntries).AsEnumerable().Any(s => x.ActivityTags.AsEnumerable().Any(t => t.Tag != null && t.Tag.Name.ToLower().Contains(s)))
    /*&& (string.IsNullOrEmpty(parameters.Equipment) || x.ActivityEquipments.Any(t => t.Equipment != null
        && parameters.Equipment.Split(";", StringSplitOptions.TrimEntries).Any(tt => t.Equipment.Name.ToLower().Contains(tt.ToLower())))) &&
    (string.IsNullOrEmpty(parameters.AgeGroup) || x.ActivityAgeGroups.Any(t => t.AgeGroup != null
        && parameters.AgeGroup.Split(";", StringSplitOptions.TrimEntries).Any(tt => t.AgeGroup.Name.ToLower().Contains(tt.ToLower()))))*/
    ))

    {
        AddInclude(t => t.ActivityTags);
        AddInclude("ActivityTags.Tag");
        AddInclude(t => t.ActivityAgeGroups);
        AddInclude("ActivityAgeGroups.AgeGroup");
        AddInclude(t => t.ActivityEquipments);
        AddInclude("ActivityEquipments.Equipment");
    }
    private static bool HasMatchingTag(IEnumerable<ActivityTag> activityTags, string tag)
    {
        var tags = tag.ToLower().Split(";", StringSplitOptions.TrimEntries);
        var result = activityTags.Any(t => t.Tag != null && tags.Any(s => t.Tag.Name.ToLower().Contains(s)));

        return result;
    }
}