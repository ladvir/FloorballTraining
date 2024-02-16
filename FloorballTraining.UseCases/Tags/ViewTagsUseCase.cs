using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagsWithSpecificationUseCase : IViewTagsWithSpecificationUseCase
{
    private readonly ITagRepository _repository;
    private readonly IMapper _mapper;

    public ViewTagsWithSpecificationUseCase(
        ITagRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<Pagination<TagDto>> ViewPaginatedAsync(TagSpecificationParameters parameters)
    {
        var countSpecification = new TagsWithFilterForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var data = await ViewAsync(parameters);

        return new Pagination<TagDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }

    public async Task<IReadOnlyList<TagDto>?> ViewAsync(TagSpecificationParameters parameters)
    {
        var specification = new TagsWithParentTagSpecification(parameters);
        var items = await _repository.GetListAsync(specification);
        return _mapper.Map<IReadOnlyList<Tag>, IReadOnlyList<TagDto>>(items);

    }
}