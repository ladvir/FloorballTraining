using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class ActivityAgeGroupEFCoreFactory(IActivityAgeGroupRepository repository, IAgeGroupFactory ageGroupFactory)
    : IActivityAgeGroupFactory
{
    public async Task<ActivityAgeGroup> GetMergedOrBuild(ActivityAgeGroupDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new ActivityAgeGroup();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(ActivityAgeGroup entity, ActivityAgeGroupDto dto)
    {
        entity.Id = dto.Id;

        var activityAgeGroup = await ageGroupFactory.GetMergedOrBuild(dto.AgeGroup!);

        entity.AgeGroup = activityAgeGroup;
        entity.AgeGroupId = activityAgeGroup.Id;
        entity.ActivityId = entity.ActivityId;
    }
}