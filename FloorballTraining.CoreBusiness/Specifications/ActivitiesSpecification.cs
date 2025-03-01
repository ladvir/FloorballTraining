﻿using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness.Specifications;

public class ActivitiesSpecification : BaseSpecification<Activity>
{
    public ActivitiesSpecification(ActivitySpecificationParameters parameters, object? env = null) : base(
        x =>
            ((string.IsNullOrEmpty(parameters.Text) || x.Name.ToLower().Contains(parameters.Text.ToLower())) || (!string.IsNullOrEmpty(x.Description) && x.Description.ToLower().Contains(parameters.Text.ToLower()))) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (string.IsNullOrEmpty(parameters.Description) || x.Description != null && x.Description.ToLower().Contains(parameters.Description.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.Persons.HasValue || (x.PersonsMin >= parameters.Persons && x.PersonsMax <= parameters.Persons)) &&
            (!parameters.PersonsMin.HasValue || x.PersonsMin >= parameters.PersonsMin) &&
            (!parameters.PersonsMax.HasValue || x.PersonsMax <= parameters.PersonsMax) &&
             (!parameters.Goalies.HasValue || (x.GoaliesMin >= parameters.Goalies && x.GoaliesMax <= parameters.Goalies)) &&
            (!parameters.GoaliesMin.HasValue || x.GoaliesMin >= parameters.GoaliesMin) &&
            (!parameters.GoaliesMax.HasValue || x.GoaliesMax <= parameters.GoaliesMax) &&
            
            (!parameters.DurationMin.HasValue && !parameters.DurationMax.HasValue || (x.DurationMax>= parameters.DurationMin.GetValueOrDefault(1)) && (x.DurationMin<= parameters.DurationMax.GetValueOrDefault(30))) &&
             
            
            (!parameters.Intensity.HasValue || x.Intensity == parameters.Intensity) &&
            (!parameters.IntensityMin.HasValue || x.Intensity >= parameters.IntensityMin) &&
            (!parameters.IntensityMax.HasValue || x.Intensity <= parameters.IntensityMax) &&
            (!parameters.Difficulty.HasValue || x.Difficulty == parameters.Difficulty) &&
            (!parameters.DifficultyMin.HasValue || x.Difficulty >= parameters.DifficultyMin) &&
            (!parameters.DifficultyMax.HasValue || x.Difficulty <= parameters.DifficultyMax) &&
            (!parameters.PlaceWidthMin.HasValue || x.PlaceWidth >= parameters.PlaceWidthMin) &&
            (!parameters.PlaceWidthMax.HasValue || x.PlaceWidth <= parameters.PlaceWidthMax) &&
            (!parameters.PlaceLengthMin.HasValue || x.PlaceLength >= parameters.PlaceLengthMin) &&
            (!parameters.PlaceLengthMax.HasValue || x.PlaceLength <= parameters.PlaceLengthMax) &&
            (!parameters.PlaceArea.HasValue || (x.PlaceWidth * x.PlaceLength) == parameters.PlaceArea) &&
            (!parameters.PlaceAreaMin.HasValue || (x.PlaceWidth * x.PlaceLength) >= parameters.PlaceAreaMin) &&
            (!parameters.PlaceAreaMax.HasValue || (x.PlaceWidth * x.PlaceLength) <= parameters.PlaceAreaMax) &&
            (string.IsNullOrEmpty(parameters.Environment) || (Enum.TryParse(typeof(Environment), parameters.Environment, true, out env) && x.Environment == (Environment)env)) &&

            (string.IsNullOrEmpty(parameters.Tag) || x.ActivityTags.AsEnumerable().Any(t => t.Tag != null && parameters.Tag.ToLower().Split(";", StringSplitOptions.RemoveEmptyEntries).AsEnumerable().Any(s => t.Tag.Id.ToString() == s))) &&
            (string.IsNullOrEmpty(parameters.Equipment) || x.ActivityEquipments.AsEnumerable().Any(t => t.Equipment != null && parameters.Equipment.ToLower().Split(";", StringSplitOptions.RemoveEmptyEntries).AsEnumerable().Any(s => t.Equipment.Id.ToString() == s))) &&
            (string.IsNullOrEmpty(parameters.AgeGroup) || parameters.AgeGroup.Split(";", StringSplitOptions.RemoveEmptyEntries).Contains("1") || x.ActivityAgeGroups.AsEnumerable().Any(t => t.AgeGroup != null && (t.AgeGroup.Name == AgeGroup.AnyAge || parameters.AgeGroup.ToLower().Split(";", StringSplitOptions.RemoveEmptyEntries).AsEnumerable().Any(s => t.AgeGroup.Id.ToString() == s)))) &&
            (parameters.AgeGroupsIds == null || !parameters.AgeGroupsIds.Any() || x.ActivityAgeGroups.AsEnumerable().Any(t => t.AgeGroup != null && parameters.AgeGroupsIds.AsEnumerable().Any(s => t.AgeGroup.Id == s)))
            )
    {
        AddInclude(t => t.ActivityTags);
        AddInclude("ActivityTags.Tag");
        AddInclude(t => t.ActivityAgeGroups);
        AddInclude("ActivityAgeGroups.AgeGroup");
        AddInclude(t => t.ActivityEquipments);
        AddInclude("ActivityEquipments.Equipment");
        //AddInclude(t => t.ActivityMedium);

        AddOrderBy(t => t.Name);
        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);
        AddSorting(parameters.Sort);
    }

    public ActivitiesSpecification(int id) : base(x => x.Id == id)
    {
        AddInclude(t => t.ActivityTags);
        AddInclude("ActivityTags.Tag");
        AddInclude(t => t.ActivityAgeGroups);
        AddInclude("ActivityAgeGroups.AgeGroup");
        AddInclude(t => t.ActivityEquipments);
        AddInclude("ActivityEquipments.Equipment");
        AddOrderBy(t => t.Name);
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