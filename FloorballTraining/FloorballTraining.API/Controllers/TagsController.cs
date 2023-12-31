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
        private readonly IViewTagsAllUseCase _viewTagsAllUseCase;


        public TagsController(

            IViewTagByIdUseCase viewTagByIdUseCase,
            IViewTagsUseCase viewTagsUseCase,
            IViewTagsAllUseCase viewTagsAllUseCase)
        {

            _viewTagByIdUseCase = viewTagByIdUseCase;
            _viewTagsUseCase = viewTagsUseCase;
            _viewTagsAllUseCase = viewTagsAllUseCase;
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

        [HttpGet("all")]
        public async Task<ActionResult<IReadOnlyList<TagDto>>> GetAllAgeGroups()
        {
            var items = await _viewTagsAllUseCase.ExecuteAsync();

            if (!items.Any())
            {
                return NotFound(new ApiResponse(404));
            }

            return new ActionResult<IReadOnlyList<TagDto>>(items);
        }

        [HttpGet("{tagId}")]
        public async Task<TagDto?> Get(int tagId)
        {
            return await _viewTagByIdUseCase.ExecuteAsync(tagId);
        }
    }
}
