using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Tags;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers
{
    public class TagsController : BaseApiController
    {
        private readonly IViewTagByIdUseCase _viewTagByIdUseCase;
        private readonly IViewTagsUseCase _viewTagsUseCase;

        public TagsController(

            IViewTagByIdUseCase viewTagByIdUseCase,
            IViewTagsUseCase viewTagsUseCase)
        {

            _viewTagByIdUseCase = viewTagByIdUseCase;
            _viewTagsUseCase = viewTagsUseCase;
        }

        [HttpGet]
        public async Task<ActionResult<Pagination<TagDto>>> Index(

            [FromQuery] TagSpecificationParameters parameters)
        {
            var tags = await _viewTagsUseCase.ExecuteAsync(parameters);

            if (!tags.Data.Any())
            {
                return NotFound(new ApiResponse(404));
            }

            return new ActionResult<Pagination<TagDto>>(tags);
        }

        [HttpGet("{tagId}")]
        public async Task<TagDto?> Get(int tagId)
        {
            return await _viewTagByIdUseCase.ExecuteAsync(tagId);
        }
    }
}
