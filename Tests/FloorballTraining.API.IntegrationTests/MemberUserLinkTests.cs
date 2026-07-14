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
/// Covers the member↔login-account linking added in "Feat - link user with member":
/// create-login, link/unlink, roster updates and admin language changes, plus club scoping.
/// </summary>
[Collection("Api")]
public class MemberUserLinkTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private int _clubId;
    private readonly List<string> _userIdsToDelete = new();

    public MemberUserLinkTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();

        var club = new Club { Name = $"LinkTestClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;
    }

    public async Task DisposeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var members = await db.Members.Where(m => m.ClubId == _clubId).ToListAsync();
        db.Members.RemoveRange(members);
        await db.SaveChangesAsync();

        foreach (var id in _userIdsToDelete.Distinct())
        {
            var user = await um.FindByIdAsync(id);
            if (user != null) await um.DeleteAsync(user);
        }

        // Also sweep any accounts created by create-login (linked to seeded members).
        var club = await db.Clubs.FindAsync(_clubId);
        if (club != null) db.Clubs.Remove(club);
        await db.SaveChangesAsync();
    }

    private async Task<int> SeedMemberAsync(string? email = null, string? appUserId = null)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var member = new Member
        {
            FirstName = "Test",
            LastName = "Member",
            BirthYear = 2000,
            Email = email ?? string.Empty,
            ClubId = _clubId,
            AppUserId = appUserId,
        };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        return member.Id;
    }

    private async Task<string> SeedUserAsync(string email)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = new AppUser { UserName = email, Email = email, FirstName = "Std", LastName = "User" };
        (await um.CreateAsync(user, "Test123!")).Succeeded.Should().BeTrue();
        _userIdsToDelete.Add(user.Id);
        return user.Id;
    }

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task CreateLogin_creates_and_links_account_with_language()
    {
        var email = $"createlogin-{Guid.NewGuid():N}@test.example";
        var memberId = await SeedMemberAsync(email);
        var client = await AdminClientAsync();

        var resp = await client.PostAsJsonAsync($"/Members/{memberId}/create-login",
            new { Password = (string?)null, SendCredentials = false, Language = "en" });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var member = await db.Members.FindAsync(memberId);
        member!.AppUserId.Should().NotBeNullOrEmpty();

        var user = await um.FindByIdAsync(member.AppUserId!);
        user.Should().NotBeNull();
        user!.PreferredLanguage.Should().Be("en");
        (await um.GetRolesAsync(user)).Should().Contain("User");
        _userIdsToDelete.Add(user.Id);
    }

    [Fact]
    public async Task AddMember_with_email_creates_and_links_login()
    {
        var email = $"newmember-{Guid.NewGuid():N}@test.example";
        var client = await AdminClientAsync();

        var resp = await client.PostAsJsonAsync("/Members", new
        {
            FirstName = "New",
            LastName = "Member",
            BirthYear = 2009,
            Email = email,
            ClubId = _clubId,
            IsActive = true,
        });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<AddMemberResult>();
        body.Should().NotBeNull();
        body!.LoginCreated.Should().BeTrue();
        body.AppUserId.Should().NotBeNullOrEmpty();
        _userIdsToDelete.Add(body.AppUserId!);

        await using var scope = _factory.Services.CreateAsyncScope();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = await um.FindByEmailAsync(email);
        user.Should().NotBeNull();
        (await um.GetRolesAsync(user!)).Should().Contain("User");
    }

    [Fact]
    public async Task AddMember_without_email_stays_roster_only()
    {
        var client = await AdminClientAsync();

        var resp = await client.PostAsJsonAsync("/Members", new
        {
            FirstName = "Roster",
            LastName = "Only",
            BirthYear = 2008,
            Email = "",
            ClubId = _clubId,
            IsActive = true,
        });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<AddMemberResult>();
        body!.LoginCreated.Should().BeFalse();
        body.AppUserId.Should().BeNullOrEmpty();
    }

    private sealed class AddMemberResult
    {
        public int MemberId { get; set; }
        public string? AppUserId { get; set; }
        public bool LoginCreated { get; set; }
        public string? Password { get; set; }
    }

    [Fact]
    public async Task CreateLogin_rejects_member_without_email()
    {
        var memberId = await SeedMemberAsync(email: null);
        var client = await AdminClientAsync();

        var resp = await client.PostAsJsonAsync($"/Members/{memberId}/create-login",
            new { SendCredentials = false });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task LinkUser_then_UnlinkUser_roundtrips()
    {
        var memberId = await SeedMemberAsync();
        var userId = await SeedUserAsync($"link-{Guid.NewGuid():N}@test.example");
        var client = await AdminClientAsync();

        var link = await client.PostAsJsonAsync($"/Members/{memberId}/link-user", new { UserId = userId });
        link.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await AssertAppUserId(memberId, userId);

        var unlink = await client.DeleteAsync($"/Members/{memberId}/link-user");
        unlink.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await AssertAppUserId(memberId, null);
    }

    [Fact]
    public async Task LinkUser_rejects_when_user_already_has_member_in_club()
    {
        var userId = await SeedUserAsync($"dup-{Guid.NewGuid():N}@test.example");
        await SeedMemberAsync(appUserId: userId);   // already a member in this club
        var otherMemberId = await SeedMemberAsync(); // unlinked member in same club
        var client = await AdminClientAsync();

        var resp = await client.PostAsJsonAsync($"/Members/{otherMemberId}/link-user", new { UserId = userId });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateRoster_updates_member_fields()
    {
        var memberId = await SeedMemberAsync();
        var client = await AdminClientAsync();

        var resp = await client.PutAsJsonAsync($"/Members/{memberId}/roster",
            new { BirthYear = 2011, Gender = 1, IsActive = false });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var member = await db.Members.FindAsync(memberId);
        member!.BirthYear.Should().Be(2011);
        member.IsActive.Should().BeFalse();
        ((int?)member.Gender).Should().Be(1);
    }

    [Fact]
    public async Task AddClub_does_not_implicitly_link_member_by_email()
    {
        var email = $"implicit-{Guid.NewGuid():N}@test.example";
        var userId = await SeedUserAsync(email);
        // An unlinked roster member in the same club sharing the user's e-mail.
        var memberId = await SeedMemberAsync(email);
        var client = await AdminClientAsync();

        // Adding the user to the club must NOT silently adopt the same-email member.
        var resp = await client.PostAsJsonAsync($"/Users/{userId}/clubs", new { ClubId = _clubId });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await AssertAppUserId(memberId, null); // still unlinked
    }

    [Fact]
    public async Task UpdateUserProfile_sets_preferred_language()
    {
        var userId = await SeedUserAsync($"lang-{Guid.NewGuid():N}@test.example");
        var client = await AdminClientAsync();

        var resp = await client.PutAsJsonAsync($"/Users/{userId}", new { PreferredLanguage = "de" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using var scope = _factory.Services.CreateAsyncScope();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = await um.FindByIdAsync(userId);
        user!.PreferredLanguage.Should().Be("de");
    }

    private async Task AssertAppUserId(int memberId, string? expected)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var member = await db.Members.FindAsync(memberId);
        member!.AppUserId.Should().Be(expected);
    }
}
