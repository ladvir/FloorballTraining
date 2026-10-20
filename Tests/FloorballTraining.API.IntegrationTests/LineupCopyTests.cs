using System.Net;
using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

[Collection("Api")]
public class LineupCopyTests(CustomWebApplicationFactory factory)
{
    private static readonly DateTime Start = new(2026, 3, 7, 10, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task CopyToAppointment_CreatesIndependentEventNamedCopy_AndReplacesExisting()
    {
        int teamId, matchA, matchB, sourceId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var club = new Club { Name = $"LC-{Guid.NewGuid():N}" };
            db.Clubs.Add(club);
            await db.SaveChangesAsync();
            var team = new Team { Name = $"LT-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
            var member = new Member { FirstName = "L", LastName = "Player", BirthYear = 2010, ClubId = club.Id };
            var formation = new FormationTemplate { Name = "t" };
            db.AddRange(team, member, formation);
            await db.SaveChangesAsync();
            teamId = team.Id;

            var a = new Appointment { Name = "Derby", AppointmentType = AppointmentType.Match, Start = Start, End = Start.AddHours(1), LocationId = 1, TeamId = teamId };
            var b = new Appointment { Name = "Pohár", AppointmentType = AppointmentType.Match, Start = Start.AddDays(7), End = Start.AddDays(7).AddHours(1), LocationId = 1, TeamId = teamId };
            db.Appointments.AddRange(a, b);
            await db.SaveChangesAsync();
            matchA = a.Id; matchB = b.Id;

            var source = new MatchLineup
            {
                TeamId = teamId, AppointmentId = matchA, Name = "Derby 7.3.2026", FormationTemplateId = formation.Id,
                Roster = [new LineupRoster { MemberId = member.Id }],
            };
            db.MatchLineups.Add(source);
            await db.SaveChangesAsync();
            sourceId = source.Id;
        }

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", await LoginHelper.GetAdminTokenAsync(client));

        // Copy twice onto event B → still exactly one lineup there, named after the event, source untouched.
        for (var i = 0; i < 2; i++)
        {
            var resp = await client.PostAsync($"/lineups/{sourceId}/copy?appointmentId={matchB}", null);
            resp.StatusCode.Should().Be(HttpStatusCode.OK);
            var copy = (await resp.Content.ReadFromJsonAsync<MatchLineupDto>())!;
            copy.Id.Should().NotBe(sourceId);
            copy.AppointmentId.Should().Be(matchB);
            copy.Name.Should().Be("Pohár 14.3.2026");
            copy.Roster.Should().HaveCount(1);
        }

        await using var check = factory.Services.CreateAsyncScope();
        var ctx = check.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await ctx.MatchLineups.CountAsync(l => l.AppointmentId == matchB)).Should().Be(1);
        var src = await ctx.MatchLineups.Include(l => l.Roster).SingleAsync(l => l.Id == sourceId);
        src.AppointmentId.Should().Be(matchA);
        src.Roster.Should().HaveCount(1);
    }
}
