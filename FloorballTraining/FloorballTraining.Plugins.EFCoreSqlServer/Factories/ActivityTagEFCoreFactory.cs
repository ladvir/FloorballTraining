using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class ActivityTagEFCoreFactory : IActivityTagFactory
{
    private readonly IActivityTagRepository _repository;
    private readonly ITagFactory _tagFactory;

    public ActivityTagEFCoreFactory(IActivityTagRepository repository, ITagFactory tagFactory)
    {
        _repository = repository;
        _tagFactory = tagFactory;
    }

    public async Task<ActivityTag> GetMergedOrBuild(TagDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new ActivityTag();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(ActivityTag entity, TagDto dto)
    {
        entity.Id = dto.Id;

        var tag = await _tagFactory.GetMergedOrBuild(dto);

        entity.Tag = tag;
        entity.TagId = tag.Id;
        entity.ActivityId = entity.ActivityId;
    }
}