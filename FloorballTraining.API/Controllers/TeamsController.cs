using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class TeamsController(
    IViewTeamsAllUseCase viewTeamsAllUseCase,
    IViewTeamByIdUseCase viewTeamByIdUseCase,
    IAddTeamUseCase addTeamUseCase,
    IEditTeamUseCase editTeamUseCase,
    IDeleteTeamUseCase deleteTeamUseCase,
    IClubRoleService clubRoleService,
    ITeamRepository teamRepository,
    ITeamMemberRepository teamMemberRepository,
    IMemberRepository memberRepository)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await viewTeamsAllUseCase.ExecuteAsync();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.ClubId.HasValue)
        {
            result = result.Where(t => t.ClubId == roleInfo.ClubId.Value).ToList();
        }

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewTeamByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();

        // Filter by active club (admin included)
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.ClubId.HasValue && result.ClubId != roleInfo.ClubId.Value)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] TeamDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        // Non-admin: force team into caller's active club
        if (roleInfo.EffectiveRole != "Admin" && roleInfo.ClubId.HasValue)
            dto.ClubId = roleInfo.ClubId.Value;

        await addTeamUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] TeamDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        await editTeamUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int teamId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        await deleteTeamUseCase.ExecuteAsync(teamId);
        return NoContent();
    }

    [HttpPost("{id}/copy-to-season")]
    public async Task<IActionResult> CopyToSeason(int id, [FromBody] CopyTeamToSeasonRequest request)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        var sourceTeam = await teamRepository.GetTeamByIdAsync(id);
        if (sourceTeam == null) return NotFound("Tým nenalezen.");

        // Use caller's active club; admin can keep source club
        var clubId = roleInfo.EffectiveRole != "Admin" && roleInfo.ClubId.HasValue
            ? roleInfo.ClubId.Value
            : sourceTeam.ClubId;

        var newTeam = new Team
        {
            Name = string.IsNullOrWhiteSpace(request.NewName) ? sourceTeam.Name : request.NewName,
            AgeGroupId = sourceTeam.AgeGroupId,
            ClubId = clubId,
            SeasonId = request.SeasonId,
            PersonsMin = sourceTeam.PersonsMin,
            PersonsMax = sourceTeam.PersonsMax,
            DefaultTrainingDuration = sourceTeam.DefaultTrainingDuration,
            MaxTrainingDuration = sourceTeam.MaxTrainingDuration,
            MaxTrainingPartDuration = sourceTeam.MaxTrainingPartDuration,
            MinPartsDurationPercent = sourceTeam.MinPartsDurationPercent,
        };

        await teamRepository.AddTeamAsync(newTeam);

        // Copy team members
        if (request.CopyMembers && sourceTeam.TeamMembers.Count > 0)
        {
            foreach (var tm in sourceTeam.TeamMembers)
            {
                var newTm = new TeamMember
                {
                    TeamId = newTeam.Id,
                    MemberId = tm.MemberId,
                    IsCoach = tm.IsCoach,
                    IsPlayer = tm.IsPlayer
                };
                await teamMemberRepository.AddTeamMemberAsync(newTm);
            }
        }

        return Ok(new { newTeamId = newTeam.Id });
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(int id, [FromBody] AddTeamMemberRequest request)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        var team = await teamRepository.GetTeamByIdAsync(id);
        if (team == null) return NotFound("Tým nenalezen.");

        if (team.TeamMembers.Any(tm => tm.MemberId == request.MemberId))
            return BadRequest("Člen je již v tomto týmu.");

        if (request.IsCoach)
        {
            var member = await memberRepository.GetMemberByIdAsync(request.MemberId);
            if (member == null) return NotFound("Člen nenalezen.");
            if (!member.HasClubRoleCoach && !member.HasClubRoleMainCoach)
                return BadRequest("Člen nemá v klubu roli trenéra. Nelze ho přidat do týmu jako trenéra.");
        }

        var tm = new TeamMember
        {
            TeamId = id,
            MemberId = request.MemberId,
            IsCoach = request.IsCoach,
            IsPlayer = request.IsPlayer
        };
        await teamMemberRepository.AddTeamMemberAsync(tm);
        return Ok(new { id = tm.Id });
    }

    [HttpDelete("{id}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(int id, int memberId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        var team = await teamRepository.GetTeamByIdAsync(id);
        if (team == null) return NotFound("Tým nenalezen.");

        var tm = team.TeamMembers.FirstOrDefault(t => t.MemberId == memberId);
        if (tm == null) return NotFound("Člen v tomto týmu nenalezen.");

        await teamMemberRepository.DeleteTeamMemberAsync(tm);
        return NoContent();
    }

    [HttpPost("{id}/import-ical")]
    public async Task<IActionResult> ImportICal(int id, [FromServices] IICalImportService iCalImportService)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        var result = await iCalImportService.ImportAsync(id, GetCurrentUserId()!);

        if (result.Errors.Count > 0 && result.Imported == 0 && result.Updated == 0)
            return BadRequest(new { message = string.Join("; ", result.Errors) });

        return Ok(result);
    }
}
