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
/// Covers guardian (parent) accounts added in Etapa 4 (#102): coach invites a parent
/// by e-mail (creating a login), duplicate-link guard, unlink, and the read-only
/// GET /guardian/children scope — a guardian sees only their own children.
/// </summary>
[Collection("Api")]
public class GuardianTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private int _clubId;
    private readonly List<string> _userIdsToDelete = new();

    public GuardianTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();

        var club = new Club { Name = $"GuardianTestClub-{Guid.NewGuid():N}" };
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

        // Removing members cascades their MemberGuardian links (FK onDelete Cascade).
        var members = await db.Members.Where(m => m.ClubId == _clubId).ToListAsync();
        db.Members.RemoveRange(members);
        await db.SaveChangesAsync();

        foreach (var id in _userIdsToDelete.Distinct())
        {
            var user = await um.FindByIdAsync(id);
            if (user != null) await um.DeleteAsync(user);
        }

        var club = await db.Clubs.FindAsync(_clubId);
        if (club != null) db.Clubs.Remove(club);
        await db.SaveChangesAsync();
    }

    private async Task<int> SeedMemberAsync(string first = "Kid", string last = "Player")
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var member = new Member
        {
            FirstName = first,
            LastName = last,
            BirthYear = 2012,
            ClubId = _clubId,
        };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        return member.Id;
    }

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private sealed class AddGuardianResult
    {
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool LoginCreated { get; set; }
        public string? Password { get; set; }
    }

    private sealed class GuardianModel
    {
        public int LinkId { get; set; }
        public string GuardianAppUserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    private sealed class ChildModel
    {
        public int MemberId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string ClubName { get; set; } = string.Empty;
    }

    [Fact]
    public async Task AddGuardian_creates_login_and_links_child()
    {
        var memberId = await SeedMemberAsync();
        var email = $"guardian-{Guid.NewGuid():N}@test.example";
        var client = await AdminClientAsync();

        var resp = await client.PostAsJsonAsync($"/Members/{memberId}/guardians",
            new { Email = email, SendCredentials = false, Language = "cs" });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<AddGuardianResult>();
        body!.LoginCreated.Should().BeTrue();
        body.Password.Should().NotBeNullOrEmpty(); // revealed: new account, not e-mailed
        _userIdsToDelete.Add(body.UserId);

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        (await db.MemberGuardians.AnyAsync(g => g.MemberId == memberId && g.GuardianAppUserId == body.UserId))
            .Should().BeTrue();
        var user = await um.FindByIdAsync(body.UserId);
        (await um.GetRolesAsync(user!)).Should().Contain("User");
    }

    [Fact]
    public async Task AddGuardian_rejects_duplicate_link()
    {
        var memberId = await SeedMemberAsync();
        var email = $"dupguardian-{Guid.NewGuid():N}@test.example";
        var client = await AdminClientAsync();

        var first = await client.PostAsJsonAsync($"/Members/{memberId}/guardians",
            new { Email = email, SendCredentials = false });
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await first.Content.ReadFromJsonAsync<AddGuardianResult>();
        _userIdsToDelete.Add(body!.UserId);

        var second = await client.PostAsJsonAsync($"/Members/{memberId}/guardians",
            new { Email = email, SendCredentials = false });
        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetChildren_returns_only_own_children()
    {
        var myChildId = await SeedMemberAsync("Mine", "Child");
        var otherChildId = await SeedMemberAsync("Other", "Child");
        var email = $"scopeguardian-{Guid.NewGuid():N}@test.example";
        var admin = await AdminClientAsync();

        // Link the guardian to ONLY one of the two children in the same club.
        var add = await admin.PostAsJsonAsync($"/Members/{myChildId}/guardians",
            new { Email = email, SendCredentials = false });
        var body = await add.Content.ReadFromJsonAsync<AddGuardianResult>();
        _userIdsToDelete.Add(body!.UserId);

        // Log in AS the guardian using the revealed password.
        var guardianClient = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(guardianClient, email, body.Password!);
        guardianClient.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var resp = await guardianClient.GetAsync("/guardian/children");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var children = await resp.Content.ReadFromJsonAsync<List<ChildModel>>();

        children!.Select(c => c.MemberId).Should().Contain(myChildId);
        children!.Select(c => c.MemberId).Should().NotContain(otherChildId);
    }

    private sealed class ResendResult
    {
        public string Email { get; set; } = string.Empty;
        public bool EmailSent { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    [Fact]
    public async Task ResendInvite_resets_password_and_lets_guardian_log_in()
    {
        var memberId = await SeedMemberAsync();
        var email = $"resend-{Guid.NewGuid():N}@test.example";
        var client = await AdminClientAsync();

        var add = await client.PostAsJsonAsync($"/Members/{memberId}/guardians",
            new { Email = email, SendCredentials = false });
        var body = await add.Content.ReadFromJsonAsync<AddGuardianResult>();
        _userIdsToDelete.Add(body!.UserId);

        var linkId = (await client.GetFromJsonAsync<List<GuardianModel>>($"/Members/{memberId}/guardians"))!.Single().LinkId;

        var resp = await client.PostAsync($"/guardians/{linkId}/resend", null);
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await resp.Content.ReadFromJsonAsync<ResendResult>();
        result!.Password.Should().NotBeNullOrEmpty(); // returned so the coach can pass it on even if e-mail fails

        // The freshly issued password actually works (proves the reset happened).
        var guardianClient = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(guardianClient, email, result.Password);
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetGuardians_then_DeleteGuardian_roundtrips()
    {
        var memberId = await SeedMemberAsync();
        var email = $"delguardian-{Guid.NewGuid():N}@test.example";
        var client = await AdminClientAsync();

        var add = await client.PostAsJsonAsync($"/Members/{memberId}/guardians",
            new { Email = email, SendCredentials = false });
        var body = await add.Content.ReadFromJsonAsync<AddGuardianResult>();
        _userIdsToDelete.Add(body!.UserId);

        var list = await client.GetFromJsonAsync<List<GuardianModel>>($"/Members/{memberId}/guardians");
        list!.Should().ContainSingle(g => g.GuardianAppUserId == body.UserId);
        var linkId = list!.Single().LinkId;

        var del = await client.DeleteAsync($"/guardians/{linkId}");
        del.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var after = await client.GetFromJsonAsync<List<GuardianModel>>($"/Members/{memberId}/guardians");
        after!.Should().BeEmpty();
    }
}
