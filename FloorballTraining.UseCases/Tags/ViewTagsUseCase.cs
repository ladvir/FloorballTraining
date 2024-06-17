using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagsWithSpecificationUseCase(
    ITagRepository repository,
    IMapper mapper) : IViewTagsWithSpecificationUseCase
{
    public async Task<Pagination<TagDto>> ViewPaginatedAsync(TagSpecificationParameters parameters)
    {
        var countSpecification = new TagsWithFilterForCountSpecification(parameters);

        var totalItems = await repository.CountAsync(countSpecification);

        var data = await ViewAsync(parameters);

        return new Pagination<TagDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }

    public async Task<IReadOnlyList<TagDto>?> ViewAsync(TagSpecificationParameters parameters)
    {
        var specification = new TagsWithParentTagSpecification(parameters);
        var items = await repository.GetListAsync(specification);
        return mapper.Map<IReadOnlyList<Tag>, IReadOnlyList<TagDto>>(items);

    }
}