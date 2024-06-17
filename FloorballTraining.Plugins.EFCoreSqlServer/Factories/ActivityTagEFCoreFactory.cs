using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class ActivityTagEFCoreFactory(IActivityTagRepository repository, ITagFactory tagFactory) : IActivityTagFactory
{
    public async Task<ActivityTag> GetMergedOrBuild(ActivityTagDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new ActivityTag();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(ActivityTag entity, ActivityTagDto dto)
    {
        entity.Id = dto.Id;

        var activityTag = await tagFactory.GetMergedOrBuild(dto.Tag!);

        entity.Tag = activityTag;
        entity.TagId = activityTag.Id;
        entity.ActivityId = entity.ActivityId;
    }
}