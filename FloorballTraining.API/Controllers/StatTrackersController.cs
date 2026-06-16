using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class StatTrackersController(
    FloorballTrainingContext context,
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService) : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private sealed record AccessScope(bool IsAdmin, int? ClubId, string EffectiveRole, List<int> CoachTeamIds);

    private async Task<AccessScope> GetScopeAsync()
    {
        var userId = GetCurrentUserId()!;
        if (User.IsInRole("Admin")) return new AccessScope(true, null, "Admin", []);
        var info = await clubRoleService.GetUserClubRoleAsync(userId);
        return new AccessScope(false, info.ClubId, info.EffectiveRole, info.CoachTeamIds);
    }

    private static bool CanEdit(AccessScope scope, int teamId)
    {
        if (scope.IsAdmin) return true;
        if (scope.EffectiveRole is "ClubAdmin" or "HeadCoach") return true;
        if (scope.EffectiveRole == "Coach" && scope.CoachTeamIds.Contains(teamId)) return true;
        return false;
    }

    private async Task<bool> CanReadTeamAsync(AccessScope scope, int teamId)
    {
        if (scope.IsAdmin) return true;
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId);
        if (team == null) return false;
        return team.ClubId == scope.ClubId;
    }

    private static int? FindSeasonId(DateTime date, IEnumerable<Season> seasons)
    {
        var s = seasons.FirstOrDefault(x => x.StartDate <= date && (x.EndDate == default || x.EndDate >= date));
        return s?.Id;
    }

    private async Task<int?> ResolveSeasonIdAsync(int teamId, DateTime eventDate)
    {
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId);
        if (team?.ClubId == null) return team?.SeasonId;
        var seasons = await context.Seasons.AsNoTracking()
            .Where(s => s.ClubId == team.ClubId)
            .ToListAsync();
        return FindSeasonId(eventDate, seasons) ?? team.SeasonId;
    }

    private IQueryable<StatTracker> Query() => context.StatTrackers
        .Include(t => t.Participants).ThenInclude(p => p.Member)
        .Include(t => t.Metrics)
        .Include(t => t.Entries);

    private async Task<StatTrackerDto> ToDtoAsync(StatTracker t)
    {
        string? createdByName = null;
        if (!string.IsNullOrEmpty(t.CreatedByUserId))
        {
            var u = await userManager.FindByIdAsync(t.CreatedByUserId);
            if (u != null) createdByName = $"{u.FirstName} {u.LastName}".Trim();
        }
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(x => x.Id == t.TeamId);
        Season? season = null;
        if (t.SeasonId.HasValue)
            season = await context.Seasons.AsNoTracking().FirstOrDefaultAsync(x => x.Id == t.SeasonId.Value);

        string? eventName = null;
        DateTime? eventDate = null;
        if (t.AppointmentId.HasValue)
        {
            var ap = await context.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == t.AppointmentId.Value);
            if (ap != null)
            {
                eventName = ap.Name ?? (ap.AppointmentType == AppointmentType.Match ? "Zápas" : "Trénink");
                eventDate = ap.Start;
            }
        }
        else if (t.TournamentMatchId.HasValue)
        {
            var match = await context.TournamentMatches.AsNoTracking()
                .Include(m => m.Tournament)
                .Include(m => m.HomeTeam)
                .Include(m => m.AwayTeam)
                .FirstOrDefaultAsync(m => m.Id == t.TournamentMatchId.Value);
            if (match != null)
            {
                var home = match.HomeTeam?.Name ?? "?";
                var away = match.AwayTeam?.Name ?? "?";
                eventName = $"{match.Tournament?.Name}: {home} – {away}";
                eventDate = match.Tournament?.UpdatedAt;
            }
        }

        var statEntries = t.Entries.Where(e => e.Kind == 0 && e.StatTrackerParticipantId.HasValue && e.StatTrackerMetricId.HasValue).ToList();
        var aggregates = statEntries
            .GroupBy(e => new { ParticipantId = e.StatTrackerParticipantId!.Value, MetricId = e.StatTrackerMetricId!.Value })
            .Select(g => new StatTrackerAggregateDto
            {
                ParticipantId = g.Key.ParticipantId,
                MetricId = g.Key.MetricId,
                Total = g.Sum(x => x.Delta),
                ByPeriod = g.Where(x => x.Period.HasValue)
                    .GroupBy(x => x.Period!.Value)
                    .ToDictionary(p => p.Key, p => p.Sum(x => x.Delta)),
            }).ToList();

        var recent = t.Entries
            .OrderByDescending(e => e.CreatedAt).ThenByDescending(e => e.Id)
            .Take(20)
            .Select(e => new StatTrackerEntryDto
            {
                Id = e.Id,
                Kind = e.Kind,
                ParticipantId = e.StatTrackerParticipantId,
                MetricId = e.StatTrackerMetricId,
                Delta = e.Delta,
                Period = e.Period,
                CreatedAt = e.CreatedAt,
            }).ToList();

        var homeScoreEntries = t.Entries.Where(e => e.Kind == 1).ToList();
        var awayScoreEntries = t.Entries.Where(e => e.Kind == 2).ToList();
        var homeScore = homeScoreEntries.Sum(e => e.Delta);
        var awayScore = awayScoreEntries.Sum(e => e.Delta);
        var homeByPeriod = homeScoreEntries.Where(e => e.Period.HasValue)
            .GroupBy(e => e.Period!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Delta));
        var awayByPeriod = awayScoreEntries.Where(e => e.Period.HasValue)
            .GroupBy(e => e.Period!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Delta));

        return new StatTrackerDto
        {
            Id = t.Id,
            EventCategory = t.EventCategory,
            TournamentMatchId = t.TournamentMatchId,
            AppointmentId = t.AppointmentId,
            TeamId = t.TeamId,
            TeamName = team?.Name,
            SeasonId = t.SeasonId,
            SeasonName = season?.Name,
            MatchLineupId = t.MatchLineupId,
            CreatedByUserId = t.CreatedByUserId,
            CreatedByUserName = createdByName,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            OpponentName = t.OpponentName,
            HomeScore = homeScore,
            AwayScore = awayScore,
            MatchPeriodCount = t.MatchPeriodCount,
            MatchPartDurationMinutes = t.MatchPartDurationMinutes,
            CurrentPeriod = t.CurrentPeriod,
            HomeScoreByPeriod = homeByPeriod,
            AwayScoreByPeriod = awayByPeriod,
            EventName = eventName,
            EventDate = eventDate,
            Participants = t.Participants
                .OrderBy(p => p.SortOrder)
                .Select(p => new StatTrackerParticipantDto
                {
                    Id = p.Id,
                    MemberId = p.MemberId,
                    FirstName = p.Member?.FirstName,
                    LastName = p.Member?.LastName,
                    Role = p.Role,
                    SortOrder = p.SortOrder,
                }).ToList(),
            Metrics = t.Metrics.OrderBy(m => m.SortOrder).Select(m => new StatTrackerMetricDto
            {
                Id = m.Id,
                Code = m.Code,
                Name = m.Name,
                IsGoalkeeper = m.IsGoalkeeper,
                SortOrder = m.SortOrder,
            }).ToList(),
            Aggregates = aggregates,
            RecentEntries = recent,
        };
    }

    /// <summary>
    /// GET /stattrackers/event?type=tournamentMatch|appointment&amp;id=123 — find tracker(s) for a given event
    /// </summary>
    [HttpGet("event")]
    public async Task<IActionResult> GetForEvent([FromQuery] string type, [FromQuery] int id, [FromQuery] int? teamId)
    {
        var scope = await GetScopeAsync();

        IQueryable<StatTracker> q = Query();
        if (type == "tournamentMatch") q = q.Where(t => t.TournamentMatchId == id);
        else if (type == "appointment") q = q.Where(t => t.AppointmentId == id);
        else return BadRequest(new { error = "type must be tournamentMatch or appointment" });

        if (teamId.HasValue) q = q.Where(t => t.TeamId == teamId.Value);

        var trackers = await q.ToListAsync();
        var allowed = new List<StatTracker>();
        foreach (var t in trackers)
        {
            if (await CanReadTeamAsync(scope, t.TeamId)) allowed.Add(t);
        }

        var result = new List<StatTrackerDto>();
        foreach (var t in allowed) result.Add(await ToDtoAsync(t));
        return Ok(result);
    }

    /// <summary>GET /stattrackers/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var t = await Query().FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!await CanReadTeamAsync(scope, t.TeamId)) return NotFound();
        return Ok(await ToDtoAsync(t));
    }

    public class CreateRequest
    {
        public int EventCategory { get; set; }
        public int? TournamentMatchId { get; set; }
        public int? AppointmentId { get; set; }
        public int TeamId { get; set; }
    }

    /// <summary>POST /stattrackers — create empty tracker for an event</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRequest dto)
    {
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, dto.TeamId)) return Forbid();
        if (!await CanReadTeamAsync(scope, dto.TeamId)) return NotFound();

        DateTime evDate = DateTime.UtcNow;
        if (dto.AppointmentId.HasValue)
        {
            var ap = await context.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == dto.AppointmentId.Value);
            if (ap != null) evDate = ap.Start;
        }

        var seasonId = await ResolveSeasonIdAsync(dto.TeamId, evDate);

        var t = new StatTracker
        {
            EventCategory = dto.EventCategory,
            TournamentMatchId = dto.TournamentMatchId,
            AppointmentId = dto.AppointmentId,
            TeamId = dto.TeamId,
            SeasonId = seasonId,
            CreatedByUserId = GetCurrentUserId(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        context.StatTrackers.Add(t);
        await context.SaveChangesAsync();

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    public class SetupRequest
    {
        public List<SetupParticipant> Participants { get; set; } = [];
        public List<SetupMetric> Metrics { get; set; } = [];
        public int? MatchLineupId { get; set; }
    }
    public class SetupParticipant { public int MemberId { get; set; } public int Role { get; set; } public int SortOrder { get; set; } }
    public class SetupMetric { public string Code { get; set; } = "custom"; public string Name { get; set; } = ""; public bool IsGoalkeeper { get; set; } public int SortOrder { get; set; } }

    /// <summary>PUT /stattrackers/{id}/setup — replace participants and metrics</summary>
    [HttpPut("{id:int}/setup")]
    public async Task<IActionResult> Setup(int id, [FromBody] SetupRequest dto)
    {
        var t = await Query().FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, t.TeamId)) return Forbid();

        // Remove participants/metrics that are no longer present (by member / by code+name combo)
        // Simpler: wipe and rebuild but preserve entries by remapping.
        var participantsByMember = t.Participants.ToDictionary(p => p.MemberId);
        var metricsByCode = t.Metrics.GroupBy(m => $"{m.Code}|{m.Name}").ToDictionary(g => g.Key, g => g.First());

        // Update / add participants
        var keepParticipantIds = new HashSet<int>();
        foreach (var pd in dto.Participants)
        {
            if (participantsByMember.TryGetValue(pd.MemberId, out var existing))
            {
                existing.Role = pd.Role;
                existing.SortOrder = pd.SortOrder;
                keepParticipantIds.Add(existing.Id);
            }
            else
            {
                var ne = new StatTrackerParticipant
                {
                    StatTrackerId = t.Id,
                    MemberId = pd.MemberId,
                    Role = pd.Role,
                    SortOrder = pd.SortOrder,
                };
                t.Participants.Add(ne);
            }
        }
        // Remove participants not in setup (if no entries reference them — safer: only remove if no entries)
        var entriesParticipantIds = t.Entries.Select(e => e.StatTrackerParticipantId).ToHashSet();
        var toRemoveParticipants = t.Participants
            .Where(p => p.Id != 0 && !keepParticipantIds.Contains(p.Id) && !entriesParticipantIds.Contains(p.Id))
            .ToList();
        foreach (var rp in toRemoveParticipants)
        {
            context.StatTrackerParticipants.Remove(rp);
            t.Participants.Remove(rp);
        }

        // Update / add metrics
        var keepMetricIds = new HashSet<int>();
        foreach (var md in dto.Metrics)
        {
            var key = $"{md.Code}|{md.Name}";
            if (metricsByCode.TryGetValue(key, out var existing))
            {
                existing.IsGoalkeeper = md.IsGoalkeeper;
                existing.SortOrder = md.SortOrder;
                keepMetricIds.Add(existing.Id);
            }
            else
            {
                var ne = new StatTrackerMetric
                {
                    StatTrackerId = t.Id,
                    Code = string.IsNullOrEmpty(md.Code) ? "custom" : md.Code,
                    Name = string.IsNullOrWhiteSpace(md.Name) ? "Metrika" : md.Name,
                    IsGoalkeeper = md.IsGoalkeeper,
                    SortOrder = md.SortOrder,
                };
                t.Metrics.Add(ne);
            }
        }
        var entriesMetricIds = t.Entries.Select(e => e.StatTrackerMetricId).ToHashSet();
        var toRemoveMetrics = t.Metrics
            .Where(m => m.Id != 0 && !keepMetricIds.Contains(m.Id) && !entriesMetricIds.Contains(m.Id))
            .ToList();
        foreach (var rm in toRemoveMetrics)
        {
            context.StatTrackerMetrics.Remove(rm);
            t.Metrics.Remove(rm);
        }

        // Persist explicit lineup choice (if provided)
        if (dto.MatchLineupId.HasValue)
        {
            var l = await context.MatchLineups.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == dto.MatchLineupId.Value && x.TeamId == t.TeamId);
            t.MatchLineupId = l?.Id;
        }
        else
        {
            t.MatchLineupId = null;
        }

        t.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    /// <summary>DELETE /stattrackers/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await context.StatTrackers
            .Include(x => x.Entries)
            .Include(x => x.Participants)
            .Include(x => x.Metrics)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, t.TeamId)) return Forbid();

        context.StatTrackerEntries.RemoveRange(t.Entries);
        context.StatTrackerParticipants.RemoveRange(t.Participants);
        context.StatTrackerMetrics.RemoveRange(t.Metrics);
        context.StatTrackers.Remove(t);
        await context.SaveChangesAsync();
        return NoContent();
    }

    public class EntryRequest
    {
        public int ParticipantId { get; set; }
        public int MetricId { get; set; }
        public int Delta { get; set; } = 1;
        public int? Period { get; set; }
    }

    /// <summary>POST /stattrackers/{id}/entries — add +1 (or -1)</summary>
    [HttpPost("{id:int}/entries")]
    public async Task<IActionResult> AddEntry(int id, [FromBody] EntryRequest dto)
    {
        var t = await context.StatTrackers
            .Include(x => x.Participants)
            .Include(x => x.Metrics)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, t.TeamId)) return Forbid();

        if (!t.Participants.Any(p => p.Id == dto.ParticipantId)) return BadRequest(new { error = "Unknown participant" });
        if (!t.Metrics.Any(m => m.Id == dto.MetricId)) return BadRequest(new { error = "Unknown metric" });

        var entry = new StatTrackerEntry
        {
            StatTrackerId = t.Id,
            Kind = 0,
            StatTrackerParticipantId = dto.ParticipantId,
            StatTrackerMetricId = dto.MetricId,
            Delta = dto.Delta == 0 ? 1 : (dto.Delta > 0 ? 1 : -1),
            Period = dto.Period.HasValue ? Math.Max(1, dto.Period.Value) : (int?)null,
            CreatedAt = DateTime.UtcNow,
        };
        context.StatTrackerEntries.Add(entry);
        t.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    public class BulkEntryRequest
    {
        public List<int> ParticipantIds { get; set; } = [];
        public int MetricId { get; set; }
        public int Delta { get; set; } = 1;
        public int? Period { get; set; }
    }

    /// <summary>POST /stattrackers/{id}/entries/bulk — add the same +/-1 to multiple participants (e.g. whole formation)</summary>
    [HttpPost("{id:int}/entries/bulk")]
    public async Task<IActionResult> AddBulkEntries(int id, [FromBody] BulkEntryRequest dto)
    {
        var t = await context.StatTrackers
            .Include(x => x.Participants)
            .Include(x => x.Metrics)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, t.TeamId)) return Forbid();

        if (!t.Metrics.Any(m => m.Id == dto.MetricId)) return BadRequest(new { error = "Unknown metric" });

        var validParticipantIds = t.Participants.Select(p => p.Id).ToHashSet();
        var delta = dto.Delta == 0 ? 1 : (dto.Delta > 0 ? 1 : -1);
        var now = DateTime.UtcNow;
        foreach (var pid in dto.ParticipantIds.Distinct())
        {
            if (!validParticipantIds.Contains(pid)) continue;
            context.StatTrackerEntries.Add(new StatTrackerEntry
            {
                StatTrackerId = t.Id,
                Kind = 0,
                StatTrackerParticipantId = pid,
                StatTrackerMetricId = dto.MetricId,
                Delta = delta,
                Period = dto.Period.HasValue ? Math.Max(1, dto.Period.Value) : (int?)null,
                CreatedAt = now,
            });
        }
        t.UpdatedAt = now;
        await context.SaveChangesAsync();

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    public class MatchInfoRequest
    {
        public string? OpponentName { get; set; }
        public int? MatchPeriodCount { get; set; }
        public int? MatchPartDurationMinutes { get; set; }
        public int? CurrentPeriod { get; set; }
    }

    /// <summary>PUT /stattrackers/{id}/match — update opponent / period config / current period (match category only)</summary>
    [HttpPut("{id:int}/match")]
    public async Task<IActionResult> UpdateMatch(int id, [FromBody] MatchInfoRequest dto)
    {
        var t = await context.StatTrackers.FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, t.TeamId)) return Forbid();

        t.OpponentName = string.IsNullOrWhiteSpace(dto.OpponentName) ? null : dto.OpponentName.Trim();
        t.MatchPeriodCount = dto.MatchPeriodCount.HasValue
            ? Math.Clamp(dto.MatchPeriodCount.Value, 1, 4)
            : null;
        t.MatchPartDurationMinutes = dto.MatchPartDurationMinutes.HasValue
            ? Math.Max(1, dto.MatchPartDurationMinutes.Value)
            : null;
        if (dto.CurrentPeriod.HasValue)
        {
            var max = t.MatchPeriodCount ?? 1;
            t.CurrentPeriod = Math.Clamp(dto.CurrentPeriod.Value, 1, Math.Max(1, max));
        }
        else
        {
            t.CurrentPeriod = null;
        }
        t.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    public class ScoreRequest
    {
        /// <summary>"home" or "away"</summary>
        public string Side { get; set; } = "home";
        /// <summary>+1 (default) or -1; not really used since users can undo via /entries/last</summary>
        public int Delta { get; set; } = 1;
        public int? Period { get; set; }
    }

    /// <summary>POST /stattrackers/{id}/score — record a score change for the home or away team</summary>
    [HttpPost("{id:int}/score")]
    public async Task<IActionResult> AddScore(int id, [FromBody] ScoreRequest dto)
    {
        var t = await context.StatTrackers.FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, t.TeamId)) return Forbid();

        var kind = dto.Side?.ToLowerInvariant() == "away" ? 2 : 1;
        var delta = dto.Delta == 0 ? 1 : (dto.Delta > 0 ? 1 : -1);
        var period = dto.Period.HasValue ? Math.Max(1, dto.Period.Value) : t.CurrentPeriod;

        context.StatTrackerEntries.Add(new StatTrackerEntry
        {
            StatTrackerId = t.Id,
            Kind = kind,
            StatTrackerParticipantId = null,
            StatTrackerMetricId = null,
            Delta = delta,
            Period = period,
            CreatedAt = DateTime.UtcNow,
        });
        t.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    /// <summary>DELETE /stattrackers/{id}/entries/last — remove the most recent entry (Undo)</summary>
    [HttpDelete("{id:int}/entries/last")]
    public async Task<IActionResult> UndoLast(int id)
    {
        var t = await context.StatTrackers
            .Include(x => x.Entries)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, t.TeamId)) return Forbid();

        // Undo whole batch: entries inserted in the same operation share an exact CreatedAt
        var last = t.Entries.OrderByDescending(e => e.CreatedAt).ThenByDescending(e => e.Id).FirstOrDefault();
        if (last != null)
        {
            var batch = t.Entries.Where(e => e.CreatedAt == last.CreatedAt).ToList();
            context.StatTrackerEntries.RemoveRange(batch);
            t.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    /// <summary>GET /stattrackers/team-templates?teamId=X</summary>
    [HttpGet("team-templates")]
    public async Task<IActionResult> GetTemplates([FromQuery] int teamId)
    {
        var scope = await GetScopeAsync();
        if (!await CanReadTeamAsync(scope, teamId)) return NotFound();
        var list = await context.TeamStatMetricTemplates.AsNoTracking()
            .Where(t => t.TeamId == teamId)
            .OrderBy(t => t.SortOrder).ThenBy(t => t.Name)
            .Select(t => new TeamStatMetricTemplateDto
            {
                Id = t.Id,
                TeamId = t.TeamId,
                Name = t.Name,
                IsGoalkeeper = t.IsGoalkeeper,
                AppliesTo = t.AppliesTo,
                SortOrder = t.SortOrder
            })
            .ToListAsync();
        return Ok(list);
    }

    /// <summary>POST /stattrackers/team-templates</summary>
    [HttpPost("team-templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] TeamStatMetricTemplateDto dto)
    {
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, dto.TeamId)) return Forbid();

        var entity = new TeamStatMetricTemplate
        {
            TeamId = dto.TeamId,
            Name = string.IsNullOrWhiteSpace(dto.Name) ? "Metrika" : dto.Name,
            IsGoalkeeper = dto.IsGoalkeeper,
            AppliesTo = string.IsNullOrEmpty(dto.AppliesTo) ? "both" : dto.AppliesTo,
            SortOrder = dto.SortOrder,
        };
        context.TeamStatMetricTemplates.Add(entity);
        await context.SaveChangesAsync();

        return Ok(new TeamStatMetricTemplateDto
        {
            Id = entity.Id,
            TeamId = entity.TeamId,
            Name = entity.Name,
            IsGoalkeeper = entity.IsGoalkeeper,
            AppliesTo = entity.AppliesTo,
            SortOrder = entity.SortOrder
        });
    }

    /// <summary>DELETE /stattrackers/team-templates/{id}</summary>
    [HttpDelete("team-templates/{id:int}")]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        var entity = await context.TeamStatMetricTemplates.FirstOrDefaultAsync(t => t.Id == id);
        if (entity == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanEdit(scope, entity.TeamId)) return Forbid();
        context.TeamStatMetricTemplates.Remove(entity);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<List<StatTrackerEventSummaryDto>> BuildEventSummariesAsync(IEnumerable<StatTracker> trackers)
    {
        var trackersList = trackers.ToList();
        if (trackersList.Count == 0) return [];

        var teamIds = trackersList.Select(t => t.TeamId).Distinct().ToList();
        var teams = await context.Teams.AsNoTracking().Where(t => teamIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, t => t.Name);

        var seasonIds = trackersList.Where(t => t.SeasonId.HasValue).Select(t => t.SeasonId!.Value).Distinct().ToList();
        var seasons = await context.Seasons.AsNoTracking().Where(s => seasonIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id, s => s.Name);

        var apIds = trackersList.Where(t => t.AppointmentId.HasValue).Select(t => t.AppointmentId!.Value).Distinct().ToList();
        var appointments = await context.Appointments.AsNoTracking().Where(a => apIds.Contains(a.Id)).ToListAsync();
        var apMap = appointments.ToDictionary(a => a.Id);

        var matchIds = trackersList.Where(t => t.TournamentMatchId.HasValue).Select(t => t.TournamentMatchId!.Value).Distinct().ToList();
        var matches = await context.TournamentMatches.AsNoTracking()
            .Include(m => m.Tournament)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Where(m => matchIds.Contains(m.Id))
            .ToListAsync();
        var matchMap = matches.ToDictionary(m => m.Id);

        return trackersList.Select(t =>
        {
            string? eventName = null;
            DateTime evDate = t.UpdatedAt;
            int? tournamentId = null;
            string? tournamentName = null;
            if (t.AppointmentId.HasValue && apMap.TryGetValue(t.AppointmentId.Value, out var ap))
            {
                eventName = ap.Name ?? (ap.AppointmentType == AppointmentType.Match ? "Zápas" : "Trénink");
                evDate = ap.Start;
            }
            else if (t.TournamentMatchId.HasValue && matchMap.TryGetValue(t.TournamentMatchId.Value, out var match))
            {
                var home = match.HomeTeam?.Name ?? "?";
                var away = match.AwayTeam?.Name ?? "?";
                eventName = $"{home} – {away}";
                tournamentId = match.TournamentId;
                tournamentName = match.Tournament?.Name;
                evDate = match.Tournament?.UpdatedAt ?? t.UpdatedAt;
            }
            return new StatTrackerEventSummaryDto
            {
                TrackerId = t.Id,
                EventCategory = t.EventCategory,
                TournamentMatchId = t.TournamentMatchId,
                TournamentId = tournamentId,
                TournamentName = tournamentName,
                AppointmentId = t.AppointmentId,
                EventName = eventName,
                EventDate = evDate,
                TeamId = t.TeamId,
                TeamName = teams.TryGetValue(t.TeamId, out var tn) ? tn : null,
                SeasonId = t.SeasonId,
                SeasonName = t.SeasonId.HasValue && seasons.TryGetValue(t.SeasonId.Value, out var sn) ? sn : null,
            };
        }).ToList();
    }

    /// <summary>GET /stattrackers/member/{memberId}/summary?eventCategory=0|1 — player profile by season</summary>
    [HttpGet("member/{memberId:int}/summary")]
    public async Task<IActionResult> MemberSummary(int memberId, [FromQuery] int? eventCategory)
    {
        var scope = await GetScopeAsync();
        var member = await context.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == memberId);
        if (member == null) return NotFound();
        if (!scope.IsAdmin && member.ClubId != scope.ClubId) return NotFound();

        var entriesQ = context.StatTrackerEntries
            .Include(e => e.StatTracker)
            .Include(e => e.Metric)
            .Include(e => e.Participant)
            .Where(e => e.Kind == 0 && e.Participant != null && e.Participant.MemberId == memberId);
        if (eventCategory.HasValue) entriesQ = entriesQ.Where(e => e.StatTracker!.EventCategory == eventCategory.Value);
        var entries = await entriesQ.AsNoTracking().ToListAsync();

        var trackerIds = entries.Select(e => e.StatTrackerId).Distinct().ToList();
        var trackers = await context.StatTrackers.AsNoTracking()
            .Where(t => trackerIds.Contains(t.Id))
            .ToListAsync();
        var summaries = await BuildEventSummariesAsync(trackers);
        var summaryById = summaries.ToDictionary(s => s.TrackerId);

        // populate per-event metric totals for this member
        foreach (var e in entries)
        {
            if (!summaryById.TryGetValue(e.StatTrackerId, out var s)) continue;
            var key = e.Metric?.Name ?? "?";
            s.Metrics[key] = (s.Metrics.TryGetValue(key, out var v) ? v : 0) + e.Delta;
        }

        // Group by season + category
        var groups = summaries
            .GroupBy(s => new { s.SeasonId, s.SeasonName, s.EventCategory })
            .Select(g => new PlayerStatsBySeasonDto
            {
                SeasonId = g.Key.SeasonId,
                SeasonName = g.Key.SeasonName,
                EventCategory = g.Key.EventCategory,
                EventCount = g.Count(),
                Totals = g.SelectMany(x => x.Metrics).GroupBy(p => p.Key).ToDictionary(p => p.Key, p => p.Sum(x => x.Value)),
                Events = g.OrderByDescending(x => x.EventDate).ToList(),
            })
            .OrderByDescending(g => g.SeasonId ?? 0)
            .ThenBy(g => g.EventCategory)
            .ToList();
        return Ok(groups);
    }

    /// <summary>GET /stattrackers/team/{teamId}/summary?eventCategory=0|1 — team summary by season</summary>
    [HttpGet("team/{teamId:int}/summary")]
    public async Task<IActionResult> TeamSummary(int teamId, [FromQuery] int? eventCategory)
    {
        var scope = await GetScopeAsync();
        if (!await CanReadTeamAsync(scope, teamId)) return NotFound();

        var entriesQ = context.StatTrackerEntries
            .Include(e => e.StatTracker)
            .Include(e => e.Metric)
            .Include(e => e.Participant).ThenInclude(p => p!.Member)
            .Where(e => e.Kind == 0 && e.Participant != null && e.StatTracker!.TeamId == teamId);
        if (eventCategory.HasValue) entriesQ = entriesQ.Where(e => e.StatTracker!.EventCategory == eventCategory.Value);
        var entries = await entriesQ.AsNoTracking().ToListAsync();

        var trackerIds = entries.Select(e => e.StatTrackerId).Distinct().ToList();
        var trackers = await context.StatTrackers.AsNoTracking()
            .Where(t => trackerIds.Contains(t.Id))
            .ToListAsync();

        // group by season + category
        var byKey = trackers
            .GroupBy(t => new { t.SeasonId, t.EventCategory })
            .ToList();

        var seasonIds = trackers.Where(t => t.SeasonId.HasValue).Select(t => t.SeasonId!.Value).Distinct().ToList();
        var seasonNames = await context.Seasons.AsNoTracking()
            .Where(s => seasonIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id, s => s.Name);

        var result = new List<TeamStatsBySeasonDto>();
        foreach (var g in byKey)
        {
            var trackerIdsInGroup = g.Select(x => x.Id).ToHashSet();
            var entriesInGroup = entries.Where(e => trackerIdsInGroup.Contains(e.StatTrackerId)).ToList();

            var totals = entriesInGroup
                .GroupBy(e => e.Metric?.Name ?? "?")
                .ToDictionary(p => p.Key, p => p.Sum(x => x.Delta));

            var players = entriesInGroup
                .GroupBy(e => new { e.Participant!.MemberId, e.Participant!.Member!.FirstName, e.Participant!.Member!.LastName })
                .Select(pg => new TeamPlayerSeasonRowDto
                {
                    MemberId = pg.Key.MemberId,
                    FirstName = pg.Key.FirstName,
                    LastName = pg.Key.LastName,
                    EventCount = pg.Select(x => x.StatTrackerId).Distinct().Count(),
                    Totals = pg.GroupBy(x => x.Metric?.Name ?? "?").ToDictionary(x => x.Key, x => x.Sum(y => y.Delta)),
                })
                .OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
                .ToList();

            result.Add(new TeamStatsBySeasonDto
            {
                SeasonId = g.Key.SeasonId,
                SeasonName = g.Key.SeasonId.HasValue && seasonNames.TryGetValue(g.Key.SeasonId.Value, out var sn) ? sn : null,
                EventCategory = g.Key.EventCategory,
                EventCount = g.Count(),
                Totals = totals,
                Players = players,
            });
        }
        return Ok(result.OrderByDescending(r => r.SeasonId ?? 0).ThenBy(r => r.EventCategory).ToList());
    }
}
