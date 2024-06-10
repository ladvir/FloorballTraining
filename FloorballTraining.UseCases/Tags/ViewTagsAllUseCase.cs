using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagsAllUseCase(
    ITagRepository repository,
    IMapper mapper) : IViewTagsAllUseCase
{
    public async Task<IReadOnlyList<TagDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.Map<IReadOnlyList<Tag>, IReadOnlyList<TagDto>>(items);
    }
}