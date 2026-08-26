using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TrainingEFCoreFactory(
    ITrainingRepository repository,
    ITrainingTagFactory trainingTagFactory,
    IAgeGroupFactory ageGroupFactory,
    ITrainingPartFactory trainingPartFactory,
    IDbContextFactory<FloorballTrainingContext> dbContextFactory)
    : ITrainingFactory
{
    public async Task<Training> GetMergedOrBuild(TrainingDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new Training();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Training entity, TrainingDto dto)
    {
        entity.Id = dto.Id;
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Difficulty = dto.Difficulty;
        entity.Duration = dto.Duration;
        entity.CommentAfter = dto.CommentAfter;
        entity.CommentBefore = dto.CommentBefore;
        entity.PersonsMin = dto.PersonsMin;
        entity.PersonsMax = dto.PersonsMax;

        entity.GoaliesMin = dto.GoaliesMin;
        entity.GoaliesMax = dto.GoaliesMax;

        entity.NoSpecificGoal = dto.NoSpecificGoal;

        entity.TrainingGoalSkill1 = await ResolveSkillAsync(dto.TrainingGoalSkill1?.Id);
        entity.TrainingGoalSkill2 = await ResolveSkillAsync(dto.TrainingGoalSkill2?.Id);
        entity.TrainingGoalSkill3 = await ResolveSkillAsync(dto.TrainingGoalSkill3?.Id);

        entity.Environment = dto.Environment;
        entity.IsDraft = dto.IsDraft;
        entity.IsIndividual = dto.IsIndividual;
        if (dto.CreatedByUserId != null) entity.CreatedByUserId = dto.CreatedByUserId;

        entity.TrainingGoalSkill1Id = dto.TrainingGoalSkill1?.Id;
        entity.TrainingGoalSkill2Id = dto.TrainingGoalSkill2?.Id;
        entity.TrainingGoalSkill3Id = dto.TrainingGoalSkill3?.Id;

        await TrainingTagsMergeOrBuild(entity, dto);
        await TrainingAgeGroupsMergeOrBuild(entity, dto);
        await TrainingPartsMergeOrBuild(entity, dto);

        entity.ActivitySignature = TrainingSimilarity.ComputeSignature(entity);
    }

    private async Task TrainingTagsMergeOrBuild(Training entity, TrainingDto dto)
    {
        if (!dto.TrainingTags.Any()) return;

        foreach (var trainingTag in dto.TrainingTags.Select(async tagDto => await trainingTagFactory.GetMergedOrBuild(tagDto)))
        {
            var x = await trainingTag;
            if (x.TagId > 0)
            {
                entity.TrainingTags.Add(x);
            }
        }
    }

    // Skill is fixed catalog data (same as ActivitySkillEFCoreFactory) — no inline-create, just
    // resolve the existing row by id so the repository layer can read .Id off the nav property.
    private async Task<Skill?> ResolveSkillAsync(int? skillId)
    {
        if (skillId is not > 0) return null;

        await using var db = await dbContextFactory.CreateDbContextAsync();
        return await db.Skills.AsNoTracking().FirstOrDefaultAsync(s => s.Id == skillId);
    }

    private async Task TrainingAgeGroupsMergeOrBuild(Training entity, TrainingDto dto)
    {
        var trainingAgeGroups = new List<TrainingAgeGroup>();

        foreach (var trainingAgeGroupDto in dto.TrainingAgeGroups ?? [])
        {
            var ageGroup = await ageGroupFactory.GetMergedOrBuild(trainingAgeGroupDto);

            var trainingAgeGroup = new TrainingAgeGroup
            {
                TrainingId = entity.Id,
                AgeGroup = ageGroup,
                AgeGroupId = ageGroup.Id
            };

            trainingAgeGroups.Add(trainingAgeGroup);
        }

        entity.TrainingAgeGroups = trainingAgeGroups;
    }

    private async Task TrainingPartsMergeOrBuild(Training entity, TrainingDto dto)
    {
        entity.TrainingParts ??= [];

        foreach (var trainingPart in (dto.TrainingParts ?? []).Select(async trainingPartDto => await trainingPartFactory.GetMergedOrBuild(trainingPartDto).ConfigureAwait(false)))
        {
            entity.TrainingParts?.Add(await trainingPart);
        }
    }
}