﻿using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness.Specifications;

public class TrainingsSpecification : BaseSpecification<Training>
{
    public TrainingsSpecification(TrainingSpecificationParameters parameters, object? env = null) : base(
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
            
            (!parameters.Duration.HasValue || (x.Duration == parameters.Duration)) &&
            (!parameters.DurationMin.HasValue || x.Duration >= parameters.DurationMin) &&
            (!parameters.DurationMax.HasValue || x.Duration <= parameters.DurationMax) &&
            (!parameters.Intensity.HasValue || x.Intensity == parameters.Intensity) &&
            (!parameters.IntensityMin.HasValue || x.Intensity >= parameters.IntensityMin) &&
            (!parameters.IntensityMax.HasValue || x.Intensity <= parameters.IntensityMax) &&
            (!parameters.Difficulty.HasValue || x.Difficulty == parameters.Difficulty) &&
            (!parameters.DifficultyMin.HasValue || x.Difficulty >= parameters.DifficultyMin) &&
            (!parameters.DifficultyMax.HasValue || x.Difficulty <= parameters.DifficultyMax) &&
            (!parameters.PlaceWidthMin.HasValue || x.Place!.Width >= parameters.PlaceWidthMin) &&
            (!parameters.PlaceWidthMax.HasValue || x.Place!.Width <= parameters.PlaceWidthMax) &&
            (!parameters.PlaceLengthMin.HasValue || x.Place!.Length >= parameters.PlaceLengthMin) &&
            (!parameters.PlaceLengthMax.HasValue || x.Place!.Length <= parameters.PlaceLengthMax) &&
            (!parameters.PlaceArea.HasValue || (x.Place!.Width * x.Place!.Length) == parameters.PlaceArea) &&
            (!parameters.PlaceAreaMin.HasValue || (x.Place!.Width * x.Place!.Length) >= parameters.PlaceAreaMin) &&
            (!parameters.PlaceAreaMax.HasValue || (x.Place!.Width * x.Place!.Length) <= parameters.PlaceAreaMax) &&
            (string.IsNullOrEmpty(parameters.Environment) || (Enum.TryParse(typeof(Environment), parameters.Environment, true, out env) && x.Place!.Environment == (Environment)env)) &&

            (!parameters.TrainingGoalId.HasValue || x.TrainingGoal1Id == parameters.TrainingGoalId || x.TrainingGoal2Id == parameters.TrainingGoalId || x.TrainingGoal3Id == parameters.TrainingGoalId) &&
            (parameters.TrainingGoalIds == null || !parameters.TrainingGoalIds.Any() || parameters.TrainingGoalIds.Any(a=>a==x.TrainingGoal1Id) || parameters.TrainingGoalIds.Any(a=>a==x.TrainingGoal2Id) || parameters.TrainingGoalIds.Any(a=>a==x.TrainingGoal3Id) ) &&
            (parameters.EquipmentsIds == null || !parameters.EquipmentsIds.Any() || (x.TrainingParts != null && x.TrainingParts
                    .SelectMany(tp => tp.TrainingGroups!).Select(tg => tg.Activity).Where(a => a != null)
                    .SelectMany(a => a!.ActivityEquipments).AsEnumerable()
                .Any(t => t.Equipment != null && parameters.EquipmentsIds.AsEnumerable()
                    .Any(s => t.Equipment.Id == s)))) &&
            (parameters.AgeGroupsIds == null || !parameters.AgeGroupsIds.Any() || x.TrainingAgeGroups.AsEnumerable().Any(t => t.AgeGroup != null && parameters.AgeGroupsIds.AsEnumerable().Any(s => t.AgeGroup.Id == s)))

           
    )
    {
        AddIncludes();
        AddOrderBy(t => t.Name);
        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);
        AddSorting(parameters.Sort);
    }

    public TrainingsSpecification(int id) : base(x => x.Id == id)
    {
        AddIncludes();
    }

    private void AddIncludes()
    {
        AddInclude(t => t.Place);
        AddInclude(t => t.TrainingAgeGroups);
        AddInclude(t => t.TrainingParts);
        AddInclude(t => t.TrainingGoal1);
        AddInclude(t => t.TrainingGoal2);
        AddInclude(t => t.TrainingGoal3);


        AddInclude("TrainingGoal1.ParentTag");
        AddInclude("TrainingGoal2.ParentTag");
        AddInclude("TrainingGoal3.ParentTag");
        AddInclude("TrainingAgeGroups.AgeGroup");
        AddInclude("TrainingParts.TrainingGroups");
        AddInclude("TrainingParts.TrainingGroups.Activity");

        AddInclude("TrainingParts.TrainingGroups.Activity.ActivityTags");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivityTags.Tag");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivityTags.Tag.ParentTag");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivityEquipments");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivityEquipments.Equipment");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivityAgeGroups");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivityAgeGroups.AgeGroup");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivityMedium");
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