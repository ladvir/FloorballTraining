using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Tags
{
    public interface IViewTagsWithSpecificationUseCase
    {
        Task<Pagination<TagDto>> ViewPaginatedAsync(TagSpecificationParameters parameters);

        Task<IReadOnlyList<TagDto>?> ViewAsync(TagSpecificationParameters parameters);




    }
}
