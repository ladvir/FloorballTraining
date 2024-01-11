using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness.Specifications;

public class ActivitiesForCountSpecification : BaseSpecification<Activity>
{
    public ActivitiesForCountSpecification(ActivitySpecificationParameters parameters, object? env = null) : base(
        x =>

    (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
    (string.IsNullOrEmpty(parameters.Description) || x.Description != null && x.Description.ToLower().Contains(parameters.Description.ToLower())) &&
    (!parameters.Id.HasValue || x.Id == parameters.Id) &&
    (!parameters.Persons.HasValue || (x.PersonsMin >= parameters.Persons && x.PersonsMax <= parameters.Persons)) &&
    (!parameters.PersonsMin.HasValue || x.PersonsMin >= parameters.PersonsMin) &&
    (!parameters.PersonsMax.HasValue || x.PersonsMax <= parameters.PersonsMax) &&
    (!parameters.Duration.HasValue || (x.DurationMin >= parameters.Duration && x.DurationMax <= parameters.Duration)) &&
    (!parameters.DurationMin.HasValue || x.DurationMin >= parameters.DurationMin) &&
    (!parameters.DurationMax.HasValue || x.DurationMax <= parameters.DurationMax) &&
    (!parameters.Intensity.HasValue || x.Intensity == parameters.Intensity) &&
    (!parameters.IntensityMin.HasValue || x.Intensity >= parameters.IntensityMin) &&
    (!parameters.IntensityMax.HasValue || x.Intensity <= parameters.IntensityMax) &&
    (!parameters.Difficulty.HasValue || x.Difficulty == parameters.Difficulty) &&
    (!parameters.DifficultyMin.HasValue || x.Difficulty >= parameters.DifficultyMin) &&
    (!parameters.DifficultyMax.HasValue || x.Difficulty <= parameters.DifficultyMax) &&
    (!parameters.PlaceWidthMin.HasValue || x.PlaceWidth >= parameters.PlaceWidthMin) &&
    (!parameters.PlaceWidthMax.HasValue || x.PlaceWidth <= parameters.PlaceWidthMax) &&
    (!parameters.PlaceArea.HasValue || (x.PlaceWidth * x.PlaceLength) == parameters.PlaceArea) &&
    (!parameters.PlaceLengthMin.HasValue || x.PlaceLength >= parameters.PlaceLengthMin) &&
    (!parameters.PlaceLengthMax.HasValue || x.PlaceLength <= parameters.PlaceLengthMax) &&
    (!parameters.PlaceAreaMin.HasValue || (x.PlaceWidth * x.PlaceLength) >= parameters.PlaceAreaMin) &&
    (!parameters.PlaceAreaMax.HasValue || (x.PlaceWidth * x.PlaceLength) <= parameters.PlaceAreaMax) &&
    (string.IsNullOrEmpty(parameters.Environment) || (Enum.TryParse(typeof(Environment), parameters.Environment, true, out env) && x.Environment == (Environment)env)) &&

    (string.IsNullOrEmpty(parameters.Tag) || x.ActivityTags.AsEnumerable().Any(t => t.Tag != null && parameters.Tag.ToLower().Split(";", StringSplitOptions.RemoveEmptyEntries).AsEnumerable().Any(s => t.Tag.Id.ToString() == s))) &&
    (string.IsNullOrEmpty(parameters.Equipment) || x.ActivityEquipments.AsEnumerable().Any(t => t.Equipment != null && parameters.Equipment.ToLower().Split(";", StringSplitOptions.RemoveEmptyEntries).AsEnumerable().Any(s => t.Equipment.Id.ToString() == s))) &&
    (string.IsNullOrEmpty(parameters.AgeGroup) || x.ActivityAgeGroups.AsEnumerable().Any(t => t.AgeGroup != null && (t.AgeGroup.Name == AgeGroup.AnyAge || parameters.AgeGroup.ToLower().Split(";", StringSplitOptions.RemoveEmptyEntries).AsEnumerable().Any(s => t.AgeGroup.Id.ToString() == s))))

    )

    {
        AddInclude(t => t.ActivityTags);
        AddInclude("ActivityTags.Tag");
        AddInclude(t => t.ActivityAgeGroups);
        AddInclude("ActivityAgeGroups.AgeGroup");
        AddInclude(t => t.ActivityEquipments);
        AddInclude("ActivityEquipments.Equipment");
    }

}