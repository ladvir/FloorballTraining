using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Tags;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly IViewTagByNameUseCase _viewTagByNameUseCase;
        private readonly IViewTagByIdUseCase _viewTagByIdUseCase;
        private readonly IViewTagsUseCase _viewTagsUseCase;

        public TagsController(
            IViewTagByNameUseCase viewTagByNameUseCase,
            IViewTagByIdUseCase viewTagByIdUseCase, IViewTagsUseCase viewTagsUseCase)
        {
            _viewTagByNameUseCase = viewTagByNameUseCase;
            _viewTagByIdUseCase = viewTagByIdUseCase;
            _viewTagsUseCase = viewTagsUseCase;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<TagDto>>> Index()
        {
            var tags = await _viewTagsUseCase.ExecuteAsync();

            return new ActionResult<IReadOnlyList<TagDto>>(tags);
        }

        [HttpGet("{tagId}")]
        public async Task<TagDto> Get(int tagId)
        {
            return await _viewTagByIdUseCase.ExecuteAsync(tagId);
        }

        [HttpGet("name/{searchText}")]
        public async Task<ActionResult<IReadOnlyList<TagDto>>> Get(string? searchText)
        {
            var tags = await _viewTagByNameUseCase.ExecuteAsync(searchText, null);

            return new ActionResult<IReadOnlyList<TagDto>>(tags);
        }
    }
}
