using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Regression guard for the admin-club-scope bug: admin with a non-null DefaultClubId
/// (active club) was incorrectly filtered to only club members. The fix makes the filter
/// a no-op for admin. Both the admin path and the coach-scoping counter-test are covered.
/// </summary>
[Collection("Api")]
public class UsersAdminScopeTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly string _outsiderEmail = $"outsider-{Guid.NewGuid():N}@test.example";
    private readonly string _coachEmail = $"coach-{Guid.NewGuid():N}@test.example";
    private const string TestPassword = "Test123!";
    private int _clubId;

    public UsersAdminScopeTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        // Create test club
        var club = new Club { Name = $"ScopeTestClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        // Outsider: registered user with no club membership
        var outsider = new AppUser
        {
            UserName = _outsiderEmail,
            Email = _outsiderEmail,
            FirstName = "Outsider",
            LastName = "NoClub",
        };
        (await um.CreateAsync(outsider, TestPassword)).Succeeded.Should().BeTrue();

        // Coach: member of the test club with Coach role flag
        var coach = new AppUser
        {
            UserName = _coachEmail,
            Email = _coachEmail,
            FirstName = "Test",
            LastName = "Coach",
            DefaultClubId = _clubId,
        };
        (await um.CreateAsync(coach, TestPassword)).Succeeded.Should().BeTrue();

        db.Members.Add(new Member
        {
            FirstName = "Test",
            LastName = "Coach",
            Email = _coachEmail,
            BirthYear = 1990,
            ClubId = _clubId,
            AppUserId = coach.Id,
            HasClubRoleCoach = true,
        });
        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        // Reset admin's active club if a test changed it
        var admin = await um.FindByEmailAsync("admin@flotr.cz");
        if (admin?.DefaultClubId != null)
        {
            admin.DefaultClubId = null;
            await um.UpdateAsync(admin);
        }

        // Remove seeded users
        foreach (var email in new[] { _outsiderEmail, _coachEmail })
        {
            var user = await um.FindByEmailAsync(email);
            if (user != null) await um.DeleteAsync(user);
        }

        // Remove members then club (FK order)
        var members = await db.Members.Where(m => m.ClubId == _clubId).ToListAsync();
        db.Members.RemoveRange(members);
        var club = await db.Clubs.FindAsync(_clubId);
        if (club != null) db.Clubs.Remove(club);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Admin_with_active_club_sees_users_outside_that_club()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        // Set admin's active club so callerRole.ClubId becomes non-null (replicates the bug scenario)
        (await client.PutAsJsonAsync("/Auth/active-club", new { ClubId = _clubId }))
            .EnsureSuccessStatusCode();

        var response = await client.GetAsync("/Users");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var users = await response.Content.ReadFromJsonAsync<List<UserItem>>();
        users.Should().NotBeNull();

        // Admin must see the outsider who has no club membership at all
        users!.Select(u => u.Email).Should().Contain(_outsiderEmail,
            "admin sees all users regardless of their active club");
    }

    [Fact]
    public async Task Coach_with_active_club_does_not_see_users_outside_that_club()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, _coachEmail, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.GetAsync("/Users");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var users = await response.Content.ReadFromJsonAsync<List<UserItem>>();
        users.Should().NotBeNull();

        // Coach scoped to the test club must NOT see the outsider with no club membership
        users!.Select(u => u.Email).Should().NotContain(_outsiderEmail,
            "coach is scoped to their active club and must not see users from other clubs");
    }

    private sealed class UserItem
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
