using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class ActivityEFCoreFactory(
    IActivityRepository repository,
    IActivityTagFactory activityTagFactory,
    IActivityEquipmentFactory activityEquipmentFactory,
    IActivityAgeGroupFactory activityAgeGroupFactory,
    IActivityMediaFactory activityMediaFactory)
    : IActivityFactory
{
    public async Task<Activity> GetMergedOrBuild(ActivityDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new Activity();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Activity entity, ActivityDto dto)
    {
        entity.Id = dto.Id;
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.PlaceWidth = dto.PlaceWidth;
        entity.PlaceLength = dto.PlaceLength;
        entity.Environment = string.IsNullOrEmpty(dto.Environment) ? Environment.Anywhere : (Environment)Enum.Parse(typeof(Environment), dto.Environment);
        entity.Difficulty = dto.Difficulty;
        entity.DurationMin = dto.DurationMin;
        entity.DurationMax = dto.DurationMax;
        entity.PersonsMin = dto.PersonsMin;
        entity.PersonsMax = dto.PersonsMax;
        entity.GoaliesMin = dto.GoaliesMin;
        entity.GoaliesMax = dto.GoaliesMax;

        await TagsMergeOrBuild(entity, dto);
        await EquipmentsMergeOrBuild(entity, dto);
        await AgeGroupsMergeOrBuild(entity, dto);
        await MediumMergeOrBuild(entity, dto);
    }

    private async Task MediumMergeOrBuild(Activity entity, ActivityDto dto)
    {
        if (!dto.ActivityMedium.Any()) return;

        foreach (var activityMedia in dto.ActivityMedium.Select(async mediumDto => await activityMediaFactory.GetMergedOrBuild(mediumDto)))
        {
            entity.ActivityMedium.Add(await activityMedia);
        }
    }

    private async Task AgeGroupsMergeOrBuild(Activity entity, ActivityDto dto)
    {
        if (!dto.ActivityAgeGroups.Any()) return;

        foreach (var activityAgeGroup in dto.ActivityAgeGroups.Select(async ageGroupDto => await activityAgeGroupFactory.GetMergedOrBuild(ageGroupDto)))
        {
            entity.ActivityAgeGroups.Add(await activityAgeGroup);
        }
    }

    private async Task TagsMergeOrBuild(Activity entity, ActivityDto dto)
    {
        if (!dto.ActivityTags.Any()) return;

        foreach (var activityTag in dto.ActivityTags.Select(async tagDto => await activityTagFactory.GetMergedOrBuild(tagDto)))
        {
            var x = await activityTag;
            if (x.TagId > 0)
            {
                entity.ActivityTags.Add(x);
            }
        }
    }

    private async Task EquipmentsMergeOrBuild(Activity entity, ActivityDto dto)
    {
        if (!dto.ActivityEquipments.Any()) return;

        foreach (var activityEquipmentDto in dto.ActivityEquipments)
        {

            var activityEquipment = await activityEquipmentFactory.GetMergedOrBuild(activityEquipmentDto);

            entity.ActivityEquipments.Add(activityEquipment);
        }
    }
}