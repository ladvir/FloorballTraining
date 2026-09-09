using FloorballTraining.API.Services;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Jobs;

/// <summary>
/// Hangfire recurring job (every 15 min, scheduled in Program.cs): reminds a player to respond to
/// an upcoming team event's attendance ("Jdu / Nejdu") when it starts within the next
/// <see cref="LeadHours"/> hours and they still haven't RSVP'd.
///
/// One reminder per (player, event): deduped on the notification's Type
/// ("event_rsvp_reminder:{appointmentId}"), so re-runs inside the 2-hour window don't re-notify.
/// Delivery (in-app bell + SignalR + Web Push) is whatever <see cref="INotificationService"/> does.
/// </summary>
public sealed class EventRsvpReminderJob(
    IDbContextFactory<FloorballTrainingContext> contextFactory,
    INotificationService notificationService,
    ILogger<EventRsvpReminderJob> logger)
{
    private const int LeadHours = 2;

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var windowEnd = now.AddHours(LeadHours);

        await using var ctx = await contextFactory.CreateDbContextAsync(ct);

        // Team events starting within the next 2 hours (personal events aren't attendance-tracked).
        var upcoming = await ctx.Appointments
            .Where(a => a.TeamId != null && a.Start > now && a.Start <= windowEnd)
            .Select(a => new { a.Id, a.Name, a.TeamId })
            .ToListAsync(ct);
        if (upcoming.Count == 0) return;

        var sent = 0;
        foreach (var apt in upcoming)
        {
            var players = await ctx.TeamMembers
                .Where(tm => tm.TeamId == apt.TeamId && tm.IsPlayer && tm.Member!.AppUserId != null)
                .Select(tm => new { tm.MemberId, AppUserId = tm.Member!.AppUserId! })
                .ToListAsync(ct);
            if (players.Count == 0) continue;

            // Any RSVP status other than 0 (Pending) counts as "already responded".
            var responded = (await ctx.EventRsvps
                .Where(r => r.AppointmentId == apt.Id && r.Status != 0)
                .Select(r => r.MemberId)
                .ToListAsync(ct)).ToHashSet();

            var reminderType = $"event_rsvp_reminder:{apt.Id}";
            var alreadySent = (await ctx.Notifications
                .Where(n => n.Type == reminderType)
                .Select(n => n.UserId)
                .ToListAsync(ct)).ToHashSet();

            const string title = "Potvrď účast";
            var message =
                $"{(string.IsNullOrWhiteSpace(apt.Name) ? "Událost" : apt.Name)} začíná do dvou hodin – dej vědět, jestli jdeš.";

            foreach (var p in players)
            {
                if (responded.Contains(p.MemberId) || alreadySent.Contains(p.AppUserId)) continue;
                await notificationService.CreateForUserAsync(p.AppUserId, reminderType, title, message);
                sent++;
            }
        }

        if (sent > 0)
            logger.LogInformation("Event RSVP reminders: sent {Count}", sent);
    }
}
