using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagByIdUseCase(ITagRepository tagRepository, IMapper mapper) : IViewTagByIdUseCase
{
    public async Task<TagDto?> ExecuteAsync(int tagId)
    {
        var tag = await tagRepository.GetByIdAsync(tagId);

        return mapper.Map<Tag?, TagDto>(tag);
    }
}