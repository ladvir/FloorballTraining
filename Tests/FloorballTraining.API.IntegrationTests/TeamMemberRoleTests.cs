using System.Net;
using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// A club member can hold multiple roles at once: a club manager (ClubAdmin) can also coach a
/// team, and an existing team member's roles (player/coach) can be edited in place instead of
/// requiring a remove + re-add round trip.
/// </summary>
[Collection("Api")]
public class TeamMemberRoleTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private int _clubId;
    private int _teamId;

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();

        var club = new Club { Name = $"RoleClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var team = new Team { Name = $"RoleTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        _teamId = team.Id;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<int> SeedMemberAsync(bool clubAdmin = false, bool coach = false)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var member = new Member
        {
            FirstName = "Test",
            LastName = $"Member-{Guid.NewGuid():N}",
            BirthYear = 2000,
            ClubId = _clubId,
            HasClubRoleClubAdmin = clubAdmin,
            HasClubRoleCoach = coach,
        };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        return member.Id;
    }

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task AddMember_allows_club_admin_to_be_added_as_coach()
    {
        var memberId = await SeedMemberAsync(clubAdmin: true);
        var client = await AdminClientAsync();

        var resp = await client.PostAsJsonAsync($"/Teams/{_teamId}/members",
            new { MemberId = memberId, IsCoach = true, IsPlayer = false });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateMember_adds_player_role_to_an_existing_coach_without_remove_readd()
    {
        var memberId = await SeedMemberAsync(coach: true);
        var client = await AdminClientAsync();
        (await client.PostAsJsonAsync($"/Teams/{_teamId}/members",
                new { MemberId = memberId, IsCoach = true, IsPlayer = false }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var resp = await client.PutAsJsonAsync($"/Teams/{_teamId}/members/{memberId}",
            new { MemberId = memberId, IsCoach = true, IsPlayer = true });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using var scope = factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var tm = await db.TeamMembers.SingleAsync(t => t.TeamId == _teamId && t.MemberId == memberId);
        tm.IsCoach.Should().BeTrue();
        tm.IsPlayer.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateMember_rejects_coach_role_without_club_eligibility()
    {
        var memberId = await SeedMemberAsync(); // plain member: no club Coach/MainCoach/ClubAdmin role
        var client = await AdminClientAsync();
        (await client.PostAsJsonAsync($"/Teams/{_teamId}/members",
                new { MemberId = memberId, IsCoach = false, IsPlayer = true }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var resp = await client.PutAsJsonAsync($"/Teams/{_teamId}/members/{memberId}",
            new { MemberId = memberId, IsCoach = true, IsPlayer = true });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
