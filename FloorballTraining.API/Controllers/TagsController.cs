using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Tags;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers
{
    public class TagsController(
        IViewTagByIdUseCase viewTagByIdUseCase,
        IViewTagsWithSpecificationUseCase viewTagsUseCase,
        IViewTagsAllUseCase viewTagsAllUseCase)
        : BaseApiController
    {
        [HttpGet]
        public async Task<ActionResult<Pagination<TagDto>>> Index(

            [FromQuery] TagSpecificationParameters parameters)
        {
            var tags = await viewTagsUseCase.ViewPaginatedAsync(parameters);

            if (tags.Data != null && !tags.Data.Any())
            {
                return NotFound(new ApiResponse(404));
            }

            return new ActionResult<Pagination<TagDto>>(tags);
        }

        [HttpGet("all")]
        public async Task<ActionResult<IReadOnlyList<TagDto>>> GetAllAgeGroups()
        {
            var items = await viewTagsAllUseCase.ExecuteAsync();

            if (!items.Any())
            {
                return NotFound(new ApiResponse(404));
            }

            return new ActionResult<IReadOnlyList<TagDto>>(items);
        }

        [HttpGet("{tagId}")]
        public async Task<TagDto?> Get(int tagId)
        {
            return await viewTagByIdUseCase.ExecuteAsync(tagId);
        }
    }
}
