using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>Goalkeeper XP (clean sheet, save %) and the clean-sheet badges, derived from stat-tracker matches.</summary>
[Collection("Api")]
public class GoalkeeperTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task CleanSheetsAndSavePct_EarnXp_AndBadges_AndRecomputeIsIdempotent()
    {
        int memberId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var club = new Club { Name = $"GkClub-{Guid.NewGuid():N}" };
            db.Clubs.Add(club);
            await db.SaveChangesAsync();
            var team = new Team { Name = "Gk", ClubId = club.Id, AgeGroupId = 1 };
            var member = new Member { FirstName = "Brankář", LastName = "Test", BirthYear = 2010, ClubId = club.Id };
            db.AddRange(team, member);
            await db.SaveChangesAsync();
            memberId = member.Id;
            db.TeamMembers.Add(new TeamMember { TeamId = team.Id, MemberId = memberId, IsPlayer = true });

            // clean, clean, clean (streak 3), conceded 3 (77 % saves), clean, clean → 5 clean sheets.
            int[] conceded = [0, 0, 0, 3, 0, 0];
            for (var i = 0; i < conceded.Length; i++)
            {
                var when = new DateTime(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc).AddDays(i);
                var tracker = new StatTracker { EventCategory = 0, TeamId = team.Id, CreatedAt = when, UpdatedAt = when };
                db.StatTrackers.Add(tracker);
                await db.SaveChangesAsync();
                var gk = new StatTrackerParticipant { StatTrackerId = tracker.Id, MemberId = memberId, Role = 1 };
                var saves = new StatTrackerMetric { StatTrackerId = tracker.Id, Code = "saves", Name = "Zákroky", IsGoalkeeper = true };
                db.AddRange(gk, saves);
                await db.SaveChangesAsync();
                db.StatTrackerEntries.Add(new StatTrackerEntry { StatTrackerId = tracker.Id, Kind = 1, Delta = 1, CreatedAt = when });
                for (var c = 0; c < conceded[i]; c++)
                    db.StatTrackerEntries.Add(new StatTrackerEntry { StatTrackerId = tracker.Id, Kind = 2, Delta = 1, CreatedAt = when });
                for (var s = 0; s < 10; s++)
                    db.StatTrackerEntries.Add(new StatTrackerEntry { StatTrackerId = tracker.Id, Kind = 0, StatTrackerParticipantId = gk.Id, StatTrackerMetricId = saves.Id, Delta = 1, CreatedAt = when });
                await db.SaveChangesAsync();
            }
        }

        await using var scope2 = factory.Services.CreateAsyncScope();
        var xp = scope2.ServiceProvider.GetRequiredService<XpService>();
        var badges = scope2.ServiceProvider.GetRequiredService<BadgeService>();
        var db2 = scope2.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        await xp.RecomputeAllAsync();
        await xp.RecomputeAllAsync(); // idempotent

        var events = await db2.XpEvents.Where(e => e.MemberId == memberId).ToListAsync();
        events.Count(e => e.Type == XpEventType.GoalkeeperCleanSheet).Should().Be(5);
        events.Count(e => e.Type == XpEventType.GoalkeeperSavePct).Should().Be(5); // 10/10 shots; the 10/13 game misses 85 %
        events.Where(e => e.Type == XpEventType.GoalkeeperCleanSheet).Should().OnlyContain(e => e.Points == XpRules.GoalkeeperCleanSheet);

        await badges.RecomputeAllAsync();
        var codes = await db2.MemberBadges.Where(b => b.MemberId == memberId).Select(b => b.Code).ToListAsync();
        codes.Should().BeEquivalentTo(["GoalkeeperCleanSheets5", "GoalkeeperCleanSheetStreak3"]);
    }
}
