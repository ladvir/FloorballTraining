using System.Net;
using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Tournament API: PUT /tournaments/{id} must reconcile teams/tasks/matches by id instead of
/// wiping and re-creating them, otherwise every autosave (e.g. after a single goal tap) hands
/// out brand-new match ids. The frontend keys match rows — and their per-row countdown timer —
/// by match id, so churning ids there resets every running timer on the next save.
/// </summary>
[Collection("Api")]
public class TournamentTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";

    private readonly string _coachEmail = $"trn-coach-{Guid.NewGuid():N}@test.example";
    private int _clubId;
    private int _tournamentId;

    public TournamentTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"TrnClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var coach = new AppUser { UserName = _coachEmail, Email = _coachEmail, FirstName = "Trn", LastName = "Coach", DefaultClubId = _clubId };
        (await um.CreateAsync(coach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Trn", LastName = "Coach", Email = _coachEmail, BirthYear = 1985,
            ClubId = _clubId, AppUserId = coach.Id, HasClubRoleMainCoach = true
        });
        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        db.TournamentMatchTaskCompletions.RemoveRange(
            db.TournamentMatchTaskCompletions.Where(c => c.TournamentMatch!.TournamentId == _tournamentId));
        db.TournamentMatches.RemoveRange(db.TournamentMatches.Where(m => m.TournamentId == _tournamentId));
        db.TournamentTeams.RemoveRange(db.TournamentTeams.Where(x => x.TournamentId == _tournamentId));
        db.Tournaments.RemoveRange(db.Tournaments.Where(x => x.Id == _tournamentId));
        await db.SaveChangesAsync();

        db.Clubs.RemoveRange(db.Clubs.Where(c => c.Id == _clubId));
        await db.SaveChangesAsync();

        var user = await um.FindByEmailAsync(_coachEmail);
        if (user != null) await um.DeleteAsync(user);
    }

    private async Task<HttpClient> CreateClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, _coachEmail, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task Repeated_autosave_keeps_match_and_team_ids_stable()
    {
        var client = await CreateClientAsync();

        var createDto = new TournamentDto
        {
            Name = "Regen Cup",
            Format = "round-robin",
            MatchDurationSeconds = 300,
            Fields = ["Hřiště 1"],
            ClubId = _clubId,
            Teams =
            [
                new TournamentTeamDto { Id = -1, Name = "Team A", SortOrder = 0 },
                new TournamentTeamDto { Id = -2, Name = "Team B", SortOrder = 1 },
            ],
            Matches =
            [
                new TournamentMatchDto { Id = -1, Round = 1, Stage = "rr", Field = "Hřiště 1", HomeTeamId = -1, AwayTeamId = -2 },
            ],
        };

        var createResponse = await client.PostAsJsonAsync("/tournaments", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var created = (await createResponse.Content.ReadFromJsonAsync<TournamentDto>())!;
        _tournamentId = created.Id;

        var matchId = created.Matches.Single().Id;
        var teamAId = created.Teams.Single(t => t.Name == "Team A").Id;
        var teamBId = created.Teams.Single(t => t.Name == "Team B").Id;

        // First autosave: start the match's timer (0:0, played=true) — mirrors MatchTimer's onStart.
        created.Matches[0].Played = true;
        var firstUpdate = await client.PutAsJsonAsync($"/tournaments/{_tournamentId}", created);
        firstUpdate.StatusCode.Should().Be(HttpStatusCode.OK);
        var afterFirst = (await firstUpdate.Content.ReadFromJsonAsync<TournamentDto>())!;

        afterFirst.Matches.Single().Id.Should().Be(matchId, "the match row must keep its id across an autosave so the frontend doesn't remount its timer");
        afterFirst.Teams.Single(t => t.Name == "Team A").Id.Should().Be(teamAId);
        afterFirst.Teams.Single(t => t.Name == "Team B").Id.Should().Be(teamBId);

        // Second autosave: a goal tap.
        afterFirst.Matches[0].HomeGoals = 1;
        var secondUpdate = await client.PutAsJsonAsync($"/tournaments/{_tournamentId}", afterFirst);
        secondUpdate.StatusCode.Should().Be(HttpStatusCode.OK);
        var afterSecond = (await secondUpdate.Content.ReadFromJsonAsync<TournamentDto>())!;

        afterSecond.Matches.Single().Id.Should().Be(matchId);
        afterSecond.Matches.Single().HomeGoals.Should().Be(1);
        afterSecond.Teams.Single(t => t.Name == "Team A").Id.Should().Be(teamAId);
        afterSecond.Teams.Single(t => t.Name == "Team B").Id.Should().Be(teamBId);
    }
}
