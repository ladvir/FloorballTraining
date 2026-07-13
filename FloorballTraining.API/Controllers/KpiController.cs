using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class KpiController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsAdmin() => User.IsInRole("Admin");

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var userId = GetCurrentUserId()!;

        // Resolve accessible team IDs
        List<int> teamIds;
        int? clubId = null;
        if (IsAdmin())
        {
            teamIds = await context.Teams.Select(t => t.Id).ToListAsync();
        }
        else
        {
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
            clubId = roleInfo.ClubId;
            if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach" && roleInfo.ClubId.HasValue)
            {
                teamIds = await context.Teams
                    .Where(t => t.ClubId == roleInfo.ClubId.Value)
                    .Select(t => t.Id)
                    .ToListAsync();
            }
            else if (roleInfo.EffectiveRole == "Coach")
            {
                teamIds = roleInfo.CoachTeamIds.Count > 0
                    ? roleInfo.CoachTeamIds
                    : (roleInfo.ClubId.HasValue
                        ? await context.Teams
                            .Where(t => t.ClubId == roleInfo.ClubId.Value)
                            .Select(t => t.Id)
                            .ToListAsync()
                        : []);
            }
            else
            {
                return Ok(new KpiSummaryDto()); // regular user — no KPI
            }
        }

        var now = DateTime.UtcNow;
        var startOf30 = now.AddDays(-30);
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOf30Future = now.AddDays(30);

        // Appointments in window: last 90 days + next 30 days (for upcoming count)
        var windowStart = now.AddDays(-90);
        var appointments = await context.Appointments
            .Where(a => a.TeamId != null && teamIds.Contains(a.TeamId.Value)
                && a.Start >= windowStart && a.Start <= endOf30Future)
            .Select(a => new
            {
                a.Id,
                a.Name,
                a.Start,
                a.End,
                a.AppointmentType,
            })
            .ToListAsync();

        var pastAppointments = appointments.Where(a => a.End <= now).ToList();
        var pastIds = pastAppointments.Select(a => a.Id).ToList();

        // Counts
        var eventsThisMonth = appointments.Count(a => a.Start >= startOfMonth && a.End <= now);
        var eventsLast30 = appointments.Count(a => a.Start >= startOf30 && a.End <= now);
        var upcoming = appointments.Count(a => a.Start > now && a.Start <= endOf30Future);

        var eventsByType = appointments
            .Where(a => a.Start >= startOf30 && a.End <= now)
            .GroupBy(a => (int)(a.AppointmentType))
            .ToDictionary(g => g.Key, g => g.Count());
        var activeMembers = clubId.HasValue
            ? await context.Members.CountAsync(m => m.ClubId == clubId.Value && m.IsActive)
            : await context.Members.CountAsync(m => m.IsActive);

        // Ratings for past events
        var ratings = pastIds.Count == 0
            ? []
            : await context.AppointmentRatings
                .Where(r => pastIds.Contains(r.AppointmentId) && r.CreatedAt >= startOf30)
                .Select(r => new { r.AppointmentId, r.Grade })
                .ToListAsync();

        var avgRating30 = ratings.Count > 0
            ? (double?)Math.Round(ratings.Average(r => (double)r.Grade), 2)
            : null;

        // Attendance for past events
        var attendance = pastIds.Count == 0
            ? []
            : await context.AppointmentAttendances
                .Where(a => pastIds.Contains(a.AppointmentId))
                .Select(a => new { a.AppointmentId, a.MemberId, a.Status })
                .ToListAsync();

        var attendanceByEvent = attendance
            .GroupBy(a => a.AppointmentId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var eventsWithAttendance30 = pastAppointments
            .Count(a => a.Start >= startOf30 && attendanceByEvent.ContainsKey(a.Id));

        var attendancePcts = pastAppointments
            .Where(a => a.Start >= startOf30 && attendanceByEvent.ContainsKey(a.Id))
            .Select(a =>
            {
                var recs = attendanceByEvent[a.Id];
                var total = recs.Count;
                var present = recs.Count(r => r.Status == 1);
                return total > 0 ? (double?)Math.Round((double)present / total * 100, 1) : null;
            })
            .Where(p => p.HasValue)
            .Select(p => p!.Value)
            .ToList();

        var avgAttendancePct = attendancePcts.Count > 0
            ? (double?)Math.Round(attendancePcts.Average(), 1)
            : null;

        // Recent events trend (last 20 past events, chrono)
        var ratingsByEvent = ratings
            .GroupBy(r => r.AppointmentId)
            .ToDictionary(g => g.Key, g => g.Average(r => (double)r.Grade));

        var recentEvents = pastAppointments
            .OrderByDescending(a => a.Start)
            .Take(20)
            .OrderBy(a => a.Start)
            .Select(a =>
            {
                var recs = attendanceByEvent.GetValueOrDefault(a.Id) ?? [];
                var present = recs.Count(x => x.Status == 1);
                var total = recs.Count;
                return new EventKpiDto
                {
                    AppointmentId = a.Id,
                    Name = a.Name,
                    Start = a.Start,
                    AppointmentType = (int)a.AppointmentType,
                    AvgRating = ratingsByEvent.TryGetValue(a.Id, out var r)
                        ? Math.Round(r, 2) : null,
                    AttendancePresent = present,
                    AttendanceTotal = total,
                    AttendancePct = total > 0 ? Math.Round((double)present / total * 100, 1) : null,
                };
            })
            .ToList();

        // Top attendees (all past events in window, min 3)
        var memberAttendance = attendance
            .GroupBy(a => a.MemberId)
            .Where(g => g.Count() >= 3)
            .Select(g => new
            {
                MemberId = g.Key,
                Total = g.Count(),
                Present = g.Count(x => x.Status == 1),
            })
            .ToList();

        var memberIds = memberAttendance.Select(m => m.MemberId).ToList();
        Dictionary<int, (string? First, string? Last)> memberNames = memberIds.Count == 0
            ? new()
            : await context.Members
                .Where(m => memberIds.Contains(m.Id))
                .ToDictionaryAsync(m => m.Id, m => (First: (string?)m.FirstName, Last: (string?)m.LastName));

        var topAttendees = memberAttendance
            .Select(m => new MemberAttendanceKpiDto
            {
                MemberId = m.MemberId,
                FirstName = memberNames.TryGetValue(m.MemberId, out var n) ? n.First : null,
                LastName = memberNames.TryGetValue(m.MemberId, out var n2) ? n2.Last : null,
                Present = m.Present,
                EventsTotal = m.Total,
                AttendancePct = m.Total > 0 ? Math.Round((double)m.Present / m.Total * 100, 1) : 0.0,
            })
            .OrderByDescending(m => m.AttendancePct)
            .ThenByDescending(m => m.Present)
            .Take(10)
            .ToList();

        // Top scorers by Canadian points (last 12 months, match events, goals+assists by metric code)
        var scoringWindowStart = now.AddMonths(-12);
        var scoringEntries = await context.StatTrackerEntries
            .Where(e => e.Kind == 0
                && e.Participant != null
                && e.StatTracker != null
                && e.StatTracker.EventCategory == 0
                && teamIds.Contains(e.StatTracker.TeamId)
                && e.CreatedAt >= scoringWindowStart
                && e.Metric != null
                && (e.Metric.Code == "goals" || e.Metric.Code == "assists"))
            .Select(e => new { MemberId = e.Participant!.MemberId, e.StatTrackerId, Code = e.Metric!.Code, e.Delta })
            .ToListAsync();

        var scorerGroups = scoringEntries
            .GroupBy(e => e.MemberId)
            .Select(g =>
            {
                var goals = g.Where(x => x.Code == "goals").Sum(x => x.Delta);
                var assists = g.Where(x => x.Code == "assists").Sum(x => x.Delta);
                return new
                {
                    MemberId = g.Key,
                    Goals = goals,
                    Assists = assists,
                    Points = goals + assists,
                    Games = g.Select(x => x.StatTrackerId).Distinct().Count(),
                };
            })
            .Where(s => s.Points != 0)
            .OrderByDescending(s => s.Points)
            .ThenByDescending(s => s.Goals)
            .Take(10)
            .ToList();

        var scorerIds = scorerGroups.Select(s => s.MemberId).ToList();
        Dictionary<int, (string? First, string? Last)> scorerNames = scorerIds.Count == 0
            ? new()
            : await context.Members
                .Where(m => scorerIds.Contains(m.Id))
                .ToDictionaryAsync(m => m.Id, m => (First: (string?)m.FirstName, Last: (string?)m.LastName));

        var topScorers = scorerGroups
            .Select(s => new MemberScoringKpiDto
            {
                MemberId = s.MemberId,
                FirstName = scorerNames.TryGetValue(s.MemberId, out var n) ? n.First : null,
                LastName = scorerNames.TryGetValue(s.MemberId, out var n2) ? n2.Last : null,
                Goals = s.Goals,
                Assists = s.Assists,
                Points = s.Points,
                GamesPlayed = s.Games,
            })
            .ToList();

        return Ok(new KpiSummaryDto
        {
            EventsThisMonth = eventsThisMonth,
            EventsLast30Days = eventsLast30,
            UpcomingNext30Days = upcoming,
            EventsByTypeLast30Days = eventsByType,
            ActiveMembers = activeMembers,
            AvgRatingLast30Days = avgRating30,
            RatingCountLast30Days = ratings.Count,
            AvgAttendancePctLast30Days = avgAttendancePct,
            EventsWithAttendanceLast30Days = eventsWithAttendance30,
            RecentEvents = recentEvents,
            TopAttendees = topAttendees,
            TopScorers = topScorers,
        });
    }
}
