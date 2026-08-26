using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

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
            (string.IsNullOrEmpty(parameters.Environment) || (Enum.TryParse(typeof(Environment), parameters.Environment, true, out env) && x.Environment == (Environment)env)) &&
            (!parameters.TrainingGoalId.HasValue || x.TrainingTags.AsEnumerable().Any(tt => tt.TagId == parameters.TrainingGoalId)) &&
            (parameters.TrainingGoalIds == null || !parameters.TrainingGoalIds.Any() || x.TrainingTags.AsEnumerable().Any(tt => tt.TagId != null && parameters.TrainingGoalIds.Contains(tt.TagId.Value))) &&
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
        AddInclude(t => t.TrainingAgeGroups);
        AddInclude(t => t.TrainingParts);
        AddInclude(t => t.TrainingTags);
        AddInclude("TrainingTags.Tag");
        AddInclude("TrainingTags.Tag.ParentTag");
        AddInclude(t => t.TrainingGoalSkill1);
        AddInclude(t => t.TrainingGoalSkill2);
        AddInclude(t => t.TrainingGoalSkill3);
        AddInclude("TrainingGoalSkill1.SkillCategory");
        AddInclude("TrainingGoalSkill2.SkillCategory");
        AddInclude("TrainingGoalSkill3.SkillCategory");

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
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivitySkills");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivitySkills.Skill");
        AddInclude("TrainingParts.TrainingGroups.Activity.ActivitySkills.Skill.SkillCategory");
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