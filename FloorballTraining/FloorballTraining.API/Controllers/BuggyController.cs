using FloorballTraining.API.Errors;
using FloorballTraining.UseCases.Tags;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class BuggyController : BaseApiController
{
    private readonly IViewTagByIdUseCase _viewTagByIdUseCase;
    public BuggyController(IViewTagByIdUseCase viewTagByIdUseCase)
    {
        _viewTagByIdUseCase = viewTagByIdUseCase;
    }

    [HttpGet("servererror")]
    public async Task<ActionResult> GetServerError()
    {
        var tag = await _viewTagByIdUseCase.ExecuteAsync(-1);


        _ = tag?.Id * 10;
        return Ok();
    }

    [HttpGet("notfound")]
    public async Task<ActionResult> GetNotFoundRequest()
    {

        var tag = await _viewTagByIdUseCase.ExecuteAsync(-1);

        if (tag == null)
        {
            return NotFound(new ApiResponse(404));
        }
        return Ok();
    }

    [HttpGet("badrequest")]
    public ActionResult GetBadRequest()
    {
        return BadRequest(new ApiResponse(400));
    }
}