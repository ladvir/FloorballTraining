using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TagEFCoreFactory : ITagFactory
{
    private readonly ITagRepository _repository;
    public TagEFCoreFactory(ITagRepository repository)
    {
        _repository = repository;
    }

    public async Task<Tag> GetMergedOrBuild(TagDto? dto)
    {
        if (dto == null)
        {
            return null;

        }
        dto ??= new TagDto();

        var entity = await _repository.GetByIdAsync(dto.Id) ?? new Tag();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Tag entity, TagDto dto)
    {
        await Task.Run(() =>
        {
            entity.Id = dto.Id;
            entity.Name = dto.Name;
            entity.Color = dto.Color;
            entity.IsTrainingGoal = dto.IsTrainingGoal;
            entity.ParentTagId = dto.ParentTagId;
        });

    }
}