using System.Text;
using FloorballTraining.API.Extensions;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Route("public/calendar")]
[AllowAnonymous]
[EnableRateLimiting(RateLimitingExtensions.PublicPolicy)]
[ApiController]
public class PublicCalendarController(FloorballTrainingContext context) : ControllerBase
{
    [HttpGet("{token}")]
    public async Task<IActionResult> GetCalendar(string token)
    {
        var team = await context.Teams
            .Where(t => t.PublicCalendarToken == token)
            .Select(t => new { t.Id, t.Name })
            .FirstOrDefaultAsync();

        if (team == null)
            return NotFound(new { error = "Odkaz není platný nebo byl zrušen." });

        var now = DateTime.UtcNow;
        var appointments = await context.Appointments
            .Where(a => a.TeamId == team.Id && a.Start >= now)
            .OrderBy(a => a.Start)
            .Select(a => new
            {
                a.Id,
                a.Name,
                Start = a.Start,
                End = a.End,
                LocationName = a.Location != null ? a.Location.Name : null,
                AppointmentType = (int)a.AppointmentType
            })
            .ToListAsync();

        return Ok(appointments);
    }

    [HttpGet("{token}.ics")]
    public async Task<IActionResult> GetICalFeed(string token)
    {
        var team = await context.Teams
            .Where(t => t.PublicCalendarToken == token)
            .Select(t => new { t.Id, t.Name })
            .FirstOrDefaultAsync();

        if (team == null)
            return NotFound(new { error = "Odkaz není platný nebo byl zrušen." });

        var now = DateTime.UtcNow;
        var appointments = await context.Appointments
            .Where(a => a.TeamId == team.Id && a.Start >= now)
            .OrderBy(a => a.Start)
            .Select(a => new
            {
                a.Id,
                a.Name,
                Start = a.Start,
                End = a.End,
                LocationName = a.Location != null ? a.Location.Name : null,
                AppointmentType = (int)a.AppointmentType
            })
            .ToListAsync();

        var typeLabels = new Dictionary<int, string>
        {
            { 0, "Trénink" }, { 1, "Soustředění" }, { 2, "Propagace" },
            { 3, "Zápas" }, { 4, "Ostatní" }, { 5, "Školení" },
            { 6, "Pořádání akce" }, { 7, "Příprava" }
        };

        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//FloTr//FloorballTraining//CS");
        sb.AppendLine($"X-WR-CALNAME:{team.Name}");
        sb.AppendLine("CALSCALE:GREGORIAN");
        sb.AppendLine("METHOD:PUBLISH");

        foreach (var apt in appointments)
        {
            var summary = apt.Name ?? (typeLabels.TryGetValue(apt.AppointmentType, out var label) ? label : "Událost");
            sb.AppendLine("BEGIN:VEVENT");
            sb.AppendLine($"UID:{apt.Id}@flotr");
            sb.AppendLine($"DTSTART:{apt.Start.ToUniversalTime():yyyyMMddTHHmmssZ}");
            sb.AppendLine($"DTEND:{apt.End.ToUniversalTime():yyyyMMddTHHmmssZ}");
            sb.AppendLine($"SUMMARY:{summary}");
            sb.AppendLine($"LOCATION:{apt.LocationName ?? ""}");
            sb.AppendLine("END:VEVENT");
        }

        sb.AppendLine("END:VCALENDAR");

        var ical = sb.ToString();
        var teamNameSafe = string.Join("_", team.Name.Split(Path.GetInvalidFileNameChars()));
        return File(Encoding.UTF8.GetBytes(ical), "text/calendar; charset=utf-8", $"{teamNameSafe}.ics");
    }
}
