using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagsUseCase : IViewTagsUseCase
{
    private readonly ITagRepository _tagRepository;
    private readonly IMapper _mapper;

    public ViewTagsUseCase(
        ITagRepository tagRepository,
        IMapper mapper)
    {
        _tagRepository = tagRepository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<TagDto>> ExecuteAsync()
    {
        var specification = new TagsWithParentTagSpecification();
        var tags = await _tagRepository.GetListAsync(specification);

        return _mapper.Map<IReadOnlyList<Tag>, IReadOnlyList<TagDto>>(tags);
    }
}