using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagByIdUseCase : IViewTagByIdUseCase
{
    private readonly ITagRepository _tagRepository;
    private readonly IMapper _mapper;

    public ViewTagByIdUseCase(ITagRepository tagRepository, IMapper mapper)
    {
        _tagRepository = tagRepository;
        _mapper = mapper;
    }

    public async Task<TagDto?> ExecuteAsync(int tagId)
    {
        var tag = await _tagRepository.GetByIdAsync(tagId);

        return _mapper.Map<Tag?, TagDto>(tag);
    }
}