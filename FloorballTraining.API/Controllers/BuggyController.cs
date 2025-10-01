using FloorballTraining.API.Errors;
using FloorballTraining.UseCases.Tags;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class BuggyController(IViewTagByIdUseCase viewTagByIdUseCase) : BaseApiController
{
    [HttpGet("servererror")]
    public async Task<ActionResult> GetServerError()
    {
        var tag = await viewTagByIdUseCase.ExecuteAsync(-1);


        _ = tag?.Id * 10;
        return Ok();
    }

    [HttpGet("notfound")]
    public async Task<ActionResult> GetNotFoundRequest()
    {

        var tag = await viewTagByIdUseCase.ExecuteAsync(-1);

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