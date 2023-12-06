
using FloorballTraining.CoreBusiness;
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

        public TagsController(
            IViewTagByNameUseCase viewTagByNameUseCase,
            IViewTagByIdUseCase viewTagByIdUseCase
            )
        {
            _viewTagByNameUseCase = viewTagByNameUseCase;
            _viewTagByIdUseCase = viewTagByIdUseCase;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tag>>> Index()
        {
            var tags = await _viewTagByNameUseCase.ExecuteAsync();

            return new ActionResult<IEnumerable<Tag>>(tags);
        }

        [HttpGet("{tagId}")]
        public async Task<Tag> Get(int tagId)
        {
            return await _viewTagByIdUseCase.ExecuteAsync(tagId);


        }




    }
}
