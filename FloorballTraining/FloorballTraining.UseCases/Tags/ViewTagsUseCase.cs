using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagsUseCase : IViewTagsUseCase
{
    private readonly ITagRepository _repository;
    private readonly IMapper _mapper;

    public ViewTagsUseCase(
        ITagRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<Pagination<TagDto>> ExecuteAsync(TagSpecificationParameters parameters)
    {
        var specification = new TagsWithParentTagSpecification(parameters);

        var countSpecification = new TagsWithFilterForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var items = await _repository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<Tag>, IReadOnlyList<TagDto>>(items);

        return new Pagination<TagDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}