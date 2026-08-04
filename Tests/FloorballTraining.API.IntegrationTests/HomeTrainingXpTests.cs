using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Layer C — capped self-report home training (#104). Covers the anti-cheat rules: XP only from
/// CONFIRMED logs, the cap (counted home = min(raw, 30% × non-home)), the reality anchor
/// (non-home = 0 → 0 counted), idempotence, and the 1-log/day rate-limit index.
/// </summary>
[Collection("Api")]
public class HomeTrainingXpTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly DateTime _now = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);
    private int _clubId;
    private int _teamId;
    private int _memberId;

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"HtClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var team = new Team { Name = $"HtTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        var member = new Member { FirstName = "Home", LastName = "Player", BirthYear = 2011, ClubId = _clubId };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        _teamId = team.Id;
        _memberId = member.Id;

        // XP is a player concept (#104) — the member must be a team player to have an XP profile.
        db.TeamMembers.Add(new TeamMember { TeamId = _teamId, MemberId = _memberId, IsPlayer = true });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    // One Present training attendance = XpRules.TrainingAttendance non-home XP.
    private async Task AddTrainingAttendanceAsync(FloorballTrainingContext db, DateTime when)
    {
        var appt = new Appointment { AppointmentType = AppointmentType.Training, Start = when, End = when.AddHours(1), LocationId = 1, TeamId = _teamId };
        db.Appointments.Add(appt);
        await db.SaveChangesAsync();
        db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = appt.Id, MemberId = _memberId, Status = 1, RecordedAt = when });
        await db.SaveChangesAsync();
    }

    private HomeTrainingLog Log(DateTime day, bool confirmed = false, bool rejected = false) => new()
    {
        MemberId = _memberId,
        Title = "Střelba na cíl",
        DurationMin = 15,
        LoggedAt = day.Date,
        ConfirmedAt = confirmed ? _now : null,
        ConfirmedByUserId = confirmed || rejected ? "confirmer" : null,
        RejectedAt = rejected ? _now : null,
        CreatedAt = _now,
    };

    private XpService Xp(IServiceScope scope) => scope.ServiceProvider.GetRequiredService<XpService>();

    [Fact]
    public async Task OnlyConfirmedLogs_EarnXp_AndRecomputeIsIdempotent()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            // Non-home = 3 × 10 = 30, so the cap (9) exceeds one confirmed home log (8) — it fully counts.
            await AddTrainingAttendanceAsync(db, _now);
            await AddTrainingAttendanceAsync(db, _now.AddDays(1));
            await AddTrainingAttendanceAsync(db, _now.AddDays(2));
            db.HomeTrainingLogs.AddRange(
                Log(_now.AddDays(-1), confirmed: true),
                Log(_now.AddDays(-2)),                 // pending
                Log(_now.AddDays(-3), rejected: true)); // rejected
            await db.SaveChangesAsync();
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var xp = Xp(scope);
            await xp.RecomputeAllAsync();

            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            (await db.XpEvents.CountAsync(e => e.MemberId == _memberId && e.Type == XpEventType.HomeTraining))
                .Should().Be(1); // only the confirmed log

            var summary = await xp.GetSummaryAsync(_memberId);
            summary.RawHomeXp.Should().Be(XpRules.HomeTraining);
            summary.CountedHomeXp.Should().Be(XpRules.HomeTraining);
            summary.TotalXp.Should().Be(3 * XpRules.TrainingAttendance + XpRules.HomeTraining);

            // Idempotent: a second recompute changes nothing.
            (await xp.RecomputeAllAsync()).Should().Be(0);
            (await xp.GetSummaryAsync(_memberId)).TotalXp.Should().Be(3 * XpRules.TrainingAttendance + XpRules.HomeTraining);
        }
    }

    [Fact]
    public async Task HomeXp_IsCapped_At30PercentOfNonHomeXp()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            // Non-home = 20 (one match) → cap = 6. Two confirmed home logs = 16 raw → counted 6.
            var match = new Appointment { AppointmentType = AppointmentType.Match, Start = _now, End = _now.AddHours(1), LocationId = 1, TeamId = _teamId };
            db.Appointments.Add(match);
            await db.SaveChangesAsync();
            db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = match.Id, MemberId = _memberId, Status = 1, RecordedAt = _now });
            db.HomeTrainingLogs.AddRange(
                Log(_now.AddDays(-1), confirmed: true),
                Log(_now.AddDays(-2), confirmed: true));
            await db.SaveChangesAsync();
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var xp = Xp(scope);
            await xp.RecomputeAllAsync();
            var summary = await xp.GetSummaryAsync(_memberId);

            var expectedCap = XpRules.MatchAttendance * XpRules.HomeXpCapPercent / 100; // 6
            summary.RawHomeXp.Should().Be(2 * XpRules.HomeTraining);   // 16
            summary.HomeXpCap.Should().Be(expectedCap);                // 6
            summary.CountedHomeXp.Should().Be(expectedCap);            // capped to 6
            summary.TotalXp.Should().Be(XpRules.MatchAttendance + expectedCap); // 26
        }
    }

    [Fact]
    public async Task RealityAnchor_NoNonHomeXp_CountsZeroHomeXp()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            // No attendance at all → non-home = 0 → cap = 0. Confirmed home logs still count nothing.
            db.HomeTrainingLogs.AddRange(
                Log(_now.AddDays(-1), confirmed: true),
                Log(_now.AddDays(-2), confirmed: true));
            await db.SaveChangesAsync();
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var xp = Xp(scope);
            await xp.RecomputeAllAsync();
            var summary = await xp.GetSummaryAsync(_memberId);

            summary.RawHomeXp.Should().Be(2 * XpRules.HomeTraining); // ledger keeps the raw figure
            summary.HomeXpCap.Should().Be(0);
            summary.CountedHomeXp.Should().Be(0);
            summary.TotalXp.Should().Be(0); // a pure self-reporter gets no level/rank
        }
    }

    [Fact]
    public async Task MultipleLogsSameDay_AreAllowed_ButCountedXpCapsAtOneTeamTraining()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            // Non-home = 4 × 10 = 40 → global cap 12 (won't bind). Two confirmed logs the SAME day = 16 raw,
            // but the per-day cap is one team training (10), so counted = 10, not 16.
            await AddTrainingAttendanceAsync(db, _now);
            await AddTrainingAttendanceAsync(db, _now.AddDays(1));
            await AddTrainingAttendanceAsync(db, _now.AddDays(2));
            await AddTrainingAttendanceAsync(db, _now.AddDays(3));
            db.HomeTrainingLogs.AddRange(
                Log(_now, confirmed: true),
                Log(_now, confirmed: true)); // same day — now allowed (no unique index)
            await db.SaveChangesAsync();
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var xp = Xp(scope);
            await xp.RecomputeAllAsync();

            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            (await db.XpEvents.CountAsync(e => e.MemberId == _memberId && e.Type == XpEventType.HomeTraining))
                .Should().Be(2); // both logs earned a ledger event

            var summary = await xp.GetSummaryAsync(_memberId);
            summary.RawHomeXp.Should().Be(2 * XpRules.HomeTraining);       // 16 raw
            summary.CountedHomeXp.Should().Be(XpRules.HomeDailyXpCap);      // capped to one team training (10)
            summary.TotalXp.Should().Be(4 * XpRules.TrainingAttendance + XpRules.HomeDailyXpCap); // 50
        }
    }

    [Fact]
    public async Task NonPlayerMember_GetsEmptyXpSummary_EvenWithSourceRecords()
    {
        int otherId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            // A member with NO player role in any team (e.g. a coach), but with real XP sources.
            var other = new Member { FirstName = "NonPlayer", LastName = "Coach", BirthYear = 1990, ClubId = _clubId };
            db.Members.Add(other);
            await db.SaveChangesAsync();
            otherId = other.Id;

            var appt = new Appointment { AppointmentType = AppointmentType.Training, Start = _now, End = _now.AddHours(1), LocationId = 1, TeamId = _teamId };
            db.Appointments.Add(appt);
            await db.SaveChangesAsync();
            db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = appt.Id, MemberId = otherId, Status = 1, RecordedAt = _now });
            db.HomeTrainingLogs.Add(new HomeTrainingLog
            {
                MemberId = otherId, Title = "Home", LoggedAt = _now.Date,
                ConfirmedAt = _now, ConfirmedByUserId = "confirmer", CreatedAt = _now,
            });
            await db.SaveChangesAsync();
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var xp = Xp(scope);
            await xp.RecomputeAllAsync();

            // XP is a player thing (#104): no player role in any team → empty summary everywhere it's read.
            var summary = await xp.GetSummaryAsync(otherId);
            summary.TotalXp.Should().Be(0);
            summary.RawHomeXp.Should().Be(0);
            summary.ByType.Should().BeEmpty();
        }
    }
}
