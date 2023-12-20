using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Tags
{
    public interface IViewTagsUseCase
    {
        Task<Pagination<TagDto>> ExecuteAsync(TagSpecificationParameters parameters);
    }
}
