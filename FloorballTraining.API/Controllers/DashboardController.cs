using FloorballTraining.UseCases.Dashboard;
using FloorballTraining.UseCases.Dashboard.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class DashboardController(
    IGetDashBoardDataUseCase getDashBoardDataUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetData()
    {
        var result = await getDashBoardDataUseCase.ExecuteAsync();
        return Ok(result);
    }
}

