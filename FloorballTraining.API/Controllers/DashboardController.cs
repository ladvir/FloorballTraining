using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.UseCases.Dashboard;
using FloorballTraining.UseCases.Dashboard.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class DashboardController(
    IGetDashBoardDataUseCase getDashBoardDataUseCase,
    IClubRoleService clubRoleService,
    FloorballTrainingContext context)
    : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetData()
    {
        var result = await getDashBoardDataUseCase.ExecuteAsync();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId != null)
        {
            // Filter by active club (admin included)
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
            var clubTeamIds = roleInfo.ClubId.HasValue
                ? await context.Teams.Where(t => t.ClubId == roleInfo.ClubId.Value).Select(t => t.Id).ToListAsync()
                : new List<int>();

            result.Appointments = result.Appointments
                .Where(a =>
                    (a.TeamId != null && clubTeamIds.Contains(a.TeamId.Value)) ||
                    (a.TeamId == null && (a.OwnerUserId == null || a.OwnerUserId == userId)))
                .ToList();
        }

        return Ok(result);
    }
}

