using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Admin configuration of the player-report quality-score weights per age group
/// (Feat15 #48). Age groups without a stored row use the code defaults.
/// </summary>
[Authorize]
public class ReportWeightsController(
    FloorballTrainingContext context,
    IAuditService auditService) : BaseApiController
{
    private bool IsAdmin() => User.IsInRole("Admin");

    [HttpGet]
    public async Task<ActionResult<List<ReportScoreWeightDto>>> GetAll()
    {
        if (!IsAdmin()) return Forbid();

        var ageGroups = await context.AgeGroups.OrderBy(g => g.Id).ToListAsync();
        var stored = await context.ReportScoreWeights.ToDictionaryAsync(w => w.AgeGroupId);

        return ageGroups.Select(g =>
        {
            var weights = stored.GetValueOrDefault(g.Id);
            return new ReportScoreWeightDto
            {
                AgeGroupId = g.Id,
                AgeGroupName = g.Description,
                WeightTests = weights?.WeightTests ?? ReportScoreWeight.DefaultTests,
                WeightAttendance = weights?.WeightAttendance ?? ReportScoreWeight.DefaultAttendance,
                WeightWorkouts = weights?.WeightWorkouts ?? ReportScoreWeight.DefaultWorkouts,
                WeightGameStats = weights?.WeightGameStats ?? ReportScoreWeight.DefaultGameStats,
                IsCustomized = weights != null,
            };
        }).ToList();
    }

    [HttpPut]
    public async Task<ActionResult<ReportScoreWeightDto>> Update(UpdateReportScoreWeightRequest request)
    {
        if (!IsAdmin()) return Forbid();

        var ageGroup = await context.AgeGroups.FindAsync(request.AgeGroupId);
        if (ageGroup == null) return NotFound(new { message = "Age group not found." });

        var sum = request.WeightTests + request.WeightAttendance
                  + request.WeightWorkouts + request.WeightGameStats;
        if (Math.Abs(sum - 1.0) > 0.001)
            return BadRequest(new { message = $"Weights must sum to 1 (got {sum:0.###})." });
        if (new[] { request.WeightTests, request.WeightAttendance, request.WeightWorkouts, request.WeightGameStats }
            .Any(w => w < 0))
            return BadRequest(new { message = "Weights must not be negative." });

        var weights = await context.ReportScoreWeights
            .FirstOrDefaultAsync(w => w.AgeGroupId == request.AgeGroupId);
        if (weights == null)
        {
            weights = new ReportScoreWeight { AgeGroupId = request.AgeGroupId };
            context.ReportScoreWeights.Add(weights);
        }

        weights.WeightTests = request.WeightTests;
        weights.WeightAttendance = request.WeightAttendance;
        weights.WeightWorkouts = request.WeightWorkouts;
        weights.WeightGameStats = request.WeightGameStats;
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.ReportWeightsUpdated, nameof(ReportScoreWeight),
            weights.Id.ToString(), new
            {
                request.AgeGroupId,
                request.WeightTests,
                request.WeightAttendance,
                request.WeightWorkouts,
                request.WeightGameStats
            });

        return new ReportScoreWeightDto
        {
            AgeGroupId = weights.AgeGroupId,
            AgeGroupName = ageGroup.Description,
            WeightTests = weights.WeightTests,
            WeightAttendance = weights.WeightAttendance,
            WeightWorkouts = weights.WeightWorkouts,
            WeightGameStats = weights.WeightGameStats,
            IsCustomized = true,
        };
    }
}
