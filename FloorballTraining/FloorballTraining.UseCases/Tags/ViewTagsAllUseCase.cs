using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagsAllUseCase : IViewTagsAllUseCase
{
    private readonly ITagRepository _repository;
    private readonly IMapper _mapper;

    public ViewTagsAllUseCase(
        ITagRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<TagDto>> ExecuteAsync()
    {
        var items = await _repository.GetAllAsync();

        return _mapper.Map<IReadOnlyList<Tag>, IReadOnlyList<TagDto>>(items);
    }
}