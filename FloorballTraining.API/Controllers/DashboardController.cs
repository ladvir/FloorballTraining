using System.Security.Claims;
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

        // Filter personal events: only show user's own unless admin
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && userId != null)
        {
            result.Appointments = result.Appointments
                .Where(a => a.TeamId != null || a.OwnerUserId == null || a.OwnerUserId == userId)
                .ToList();
        }

        return Ok(result);
    }
}

