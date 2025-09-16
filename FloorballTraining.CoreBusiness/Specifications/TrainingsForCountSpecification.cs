using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness.Specifications;

public class TrainingsForCountSpecification : BaseSpecification<Training>
{
    public TrainingsForCountSpecification(TrainingSpecificationParameters parameters, object? env = null) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (string.IsNullOrEmpty(parameters.Description) || x.Description != null && x.Description.ToLower().Contains(parameters.Description.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.Persons.HasValue || (x.PersonsMin >= parameters.Persons && x.PersonsMax <= parameters.Persons)) &&
            (!parameters.PersonsMin.HasValue || x.PersonsMin >= parameters.PersonsMin) &&
            (!parameters.PersonsMax.HasValue || x.PersonsMax <= parameters.PersonsMax) &&
            (!parameters.Duration.HasValue || (x.Duration == parameters.Duration)) &&
            (!parameters.DurationMin.HasValue || x.Duration >= parameters.DurationMin) &&
            (!parameters.DurationMax.HasValue || x.Duration <= parameters.DurationMax) &&
            (!parameters.Intensity.HasValue || x.Intensity == parameters.Intensity) &&
            (!parameters.IntensityMin.HasValue || x.Intensity >= parameters.IntensityMin) &&
            (!parameters.IntensityMax.HasValue || x.Intensity <= parameters.IntensityMax) &&
            (!parameters.Difficulty.HasValue || x.Difficulty == parameters.Difficulty) &&
            (!parameters.DifficultyMin.HasValue || x.Difficulty >= parameters.DifficultyMin) &&
            (!parameters.DifficultyMax.HasValue || x.Difficulty <= parameters.DifficultyMax) &&
            (string.IsNullOrEmpty(parameters.Environment) || (Enum.TryParse(typeof(Environment), parameters.Environment, true, out env) && x.Environment == (Environment)env)) &&

            (!parameters.TrainingGoalId.HasValue || x.TrainingGoal1Id == parameters.TrainingGoalId || x.TrainingGoal2Id == parameters.TrainingGoalId || x.TrainingGoal3Id == parameters.TrainingGoalId) &&
            (parameters.EquipmentsIds == null || !parameters.EquipmentsIds.Any() || (x.TrainingParts != null && x.TrainingParts
                .SelectMany(tp => tp.TrainingGroups!).Select(tg => tg.Activity).Where(a => a != null)
                .SelectMany(a => a!.ActivityEquipments).AsEnumerable()
                .Any(t => t.Equipment != null && parameters.EquipmentsIds.AsEnumerable()
                    .Any(s => t.Equipment.Id == s)))) &&
            (parameters.AgeGroupsIds == null || !parameters.AgeGroupsIds.Any() || x.TrainingAgeGroups.AsEnumerable().Any(t => t.AgeGroup != null && parameters.AgeGroupsIds.AsEnumerable().Any(s => t.AgeGroup.Id == s)))

    )
    {
        AddInclude(t => t.TrainingAgeGroups);
        AddInclude(t => t.TrainingParts);
        AddInclude(t => t.TrainingGoal1);
        AddInclude(t => t.TrainingGoal2);
        AddInclude(t => t.TrainingGoal3);

        AddInclude("TrainingAgeGroups.AgeGroup");

        AddInclude("TrainingParts.TrainingGroups");
    }
}