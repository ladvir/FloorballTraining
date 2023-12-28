using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;


namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class TagEFCoreFactory : ITagFactory
{
    private readonly ITagRepository _repository;

    public TagEFCoreFactory(ITagRepository repository)
    {
        _repository = repository;
    }

    public async Task<Tag> GetMergedOrBuild(TagDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new Tag();

        MergeDto(entity, dto);

        return entity;
    }
    public void MergeDto(Tag entity, TagDto dto)
    {

        entity.Id = dto.Id;
        entity.Name = dto.Name;
        entity.Color = dto.Color;
        entity.IsTrainingGoal = dto.IsTrainingGoal;
        entity.ParentTagId = dto.ParentTagId;
    }
}