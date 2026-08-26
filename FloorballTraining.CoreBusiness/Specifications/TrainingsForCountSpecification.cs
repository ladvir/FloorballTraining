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

            (!parameters.TrainingGoalId.HasValue || x.TrainingTags.AsEnumerable().Any(tt => tt.TagId == parameters.TrainingGoalId)) &&
            (parameters.EquipmentsIds == null || !parameters.EquipmentsIds.Any() || (x.TrainingParts != null && x.TrainingParts
                .SelectMany(tp => tp.TrainingGroups!).Select(tg => tg.Activity).Where(a => a != null)
                .SelectMany(a => a!.ActivityEquipments).AsEnumerable()
                .Any(t => t.Equipment != null && parameters.EquipmentsIds.AsEnumerable()
                    .Any(s => t.Equipment.Id == s)))) &&
            (parameters.AgeGroupsIds == null || !parameters.AgeGroupsIds.Any() || x.TrainingAgeGroups.AsEnumerable().Any(t => t.AgeGroup != null && parameters.AgeGroupsIds.AsEnumerable().Any(s => t.AgeGroup.Id == s))) &&
            (parameters.SkillIds == null || !parameters.SkillIds.Any() || (x.TrainingParts != null && x.TrainingParts
                    .SelectMany(tp => tp.TrainingGroups!).Select(tg => tg.Activity).Where(a => a != null)
                    .SelectMany(a => a!.ActivitySkills).AsEnumerable()
                .Any(t => t.Skill != null && parameters.SkillIds.AsEnumerable()
                    .Any(s => t.Skill.Id == s)))) &&
            (!parameters.GoalSkillId.HasValue || x.TrainingGoalSkill1Id == parameters.GoalSkillId || x.TrainingGoalSkill2Id == parameters.GoalSkillId || x.TrainingGoalSkill3Id == parameters.GoalSkillId) &&
            (parameters.GoalSkillIds == null || !parameters.GoalSkillIds.Any() || parameters.GoalSkillIds.Any(a => a == x.TrainingGoalSkill1Id) || parameters.GoalSkillIds.Any(a => a == x.TrainingGoalSkill2Id) || parameters.GoalSkillIds.Any(a => a == x.TrainingGoalSkill3Id))

    )
    {
        AddInclude(t => t.TrainingAgeGroups);
        AddInclude(t => t.TrainingParts);
        AddInclude(t => t.TrainingTags);
        AddInclude(t => t.TrainingGoalSkill1);
        AddInclude(t => t.TrainingGoalSkill2);
        AddInclude(t => t.TrainingGoalSkill3);

        AddInclude("TrainingAgeGroups.AgeGroup");

        AddInclude("TrainingParts.TrainingGroups");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivitySkills");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivitySkills.Skill");
    }
}