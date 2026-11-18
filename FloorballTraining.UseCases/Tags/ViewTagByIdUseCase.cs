using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagByIdUseCase(ITagRepository tagRepository, AppMapper mapper) : IViewTagByIdUseCase
{
    public async Task<TagDto?> ExecuteAsync(int tagId)
    {
        var tag = await tagRepository.GetByIdAsync(tagId);

        return mapper.ToTagDto(tag);
    }
}