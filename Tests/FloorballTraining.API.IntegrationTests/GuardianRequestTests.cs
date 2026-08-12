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
/// Covers the parent self-service guardian request flow (#113): a coach issues an invite
/// code for a child, a parent files a request against it (anonymously, creating a login),
/// and a coach approves/rejects it. Approval creates the same MemberGuardian link the
/// coach-invite flow (#102) creates.
/// </summary>
[Collection("Api")]
public class GuardianRequestTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private int _clubId;
    private readonly List<string> _userIdsToDelete = new();

    public GuardianRequestTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();

        var club = new Club { Name = $"GuardianRequestTestClub-{Guid.NewGuid():N}" };
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

        var requests = await db.GuardianRequests
            .Where(r => r.Member!.ClubId == _clubId)
            .ToListAsync();
        db.GuardianRequests.RemoveRange(requests);
        await db.SaveChangesAsync();

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

    private sealed class InviteCodeModel
    {
        public string Code { get; set; } = string.Empty;
    }

    private sealed class CreateRequestResult
    {
        public bool LoginCreated { get; set; }
        public bool EmailSent { get; set; }
    }

    private sealed class GuardianRequestModel
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public string ChildName { get; set; } = string.Empty;
        public string GuardianEmail { get; set; } = string.Empty;
    }

    private async Task<string> IssueInviteCodeAsync(HttpClient admin, int memberId)
    {
        var resp = await admin.PostAsync($"/Members/{memberId}/guardian-invite-code", null);
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<InviteCodeModel>();
        return body!.Code;
    }

    [Fact]
    public async Task Create_with_invalid_code_is_rejected()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/GuardianRequests",
            new { Email = $"nope-{Guid.NewGuid():N}@test.example", Code = "not-a-real-code" });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_files_pending_request_and_creates_login()
    {
        var memberId = await SeedMemberAsync();
        var admin = await AdminClientAsync();
        var code = await IssueInviteCodeAsync(admin, memberId);

        var email = $"selfreq-{Guid.NewGuid():N}@test.example";
        var anon = _factory.CreateClient();
        var resp = await anon.PostAsJsonAsync("/GuardianRequests", new { Email = email, Code = code });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await resp.Content.ReadFromJsonAsync<CreateRequestResult>();
        result!.LoginCreated.Should().BeTrue();

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var user = await um.FindByEmailAsync(email);
        user.Should().NotBeNull();
        _userIdsToDelete.Add(user!.Id);

        (await db.GuardianRequests.AnyAsync(r =>
                r.MemberId == memberId && r.GuardianAppUserId == user.Id && r.Status == GuardianRequestStatus.Pending))
            .Should().BeTrue();
        // Not linked yet — only a coach approval creates the MemberGuardian link.
        (await db.MemberGuardians.AnyAsync(g => g.MemberId == memberId && g.GuardianAppUserId == user.Id))
            .Should().BeFalse();
    }

    [Fact]
    public async Task Approve_creates_MemberGuardian_link()
    {
        var memberId = await SeedMemberAsync();
        var admin = await AdminClientAsync();
        var code = await IssueInviteCodeAsync(admin, memberId);

        var email = $"approve-{Guid.NewGuid():N}@test.example";
        var anon = _factory.CreateClient();
        await anon.PostAsJsonAsync("/GuardianRequests", new { Email = email, Code = code });

        var pending = await admin.GetFromJsonAsync<List<GuardianRequestModel>>("/GuardianRequests");
        var req = pending!.Single(r => r.MemberId == memberId && r.GuardianEmail == email);

        var approve = await admin.PutAsync($"/GuardianRequests/{req.Id}/approve", null);
        approve.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = await um.FindByEmailAsync(email);
        _userIdsToDelete.Add(user!.Id);

        (await db.MemberGuardians.AnyAsync(g => g.MemberId == memberId && g.GuardianAppUserId == user.Id))
            .Should().BeTrue();
        var reloaded = await db.GuardianRequests.FirstAsync(r => r.Id == req.Id);
        reloaded.Status.Should().Be(GuardianRequestStatus.Approved);

        // No longer pending, so it can't be double-approved.
        var second = await admin.PutAsync($"/GuardianRequests/{req.Id}/approve", null);
        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Reject_leaves_no_link()
    {
        var memberId = await SeedMemberAsync();
        var admin = await AdminClientAsync();
        var code = await IssueInviteCodeAsync(admin, memberId);

        var email = $"reject-{Guid.NewGuid():N}@test.example";
        var anon = _factory.CreateClient();
        await anon.PostAsJsonAsync("/GuardianRequests", new { Email = email, Code = code });

        var pending = await admin.GetFromJsonAsync<List<GuardianRequestModel>>("/GuardianRequests");
        var req = pending!.Single(r => r.MemberId == memberId && r.GuardianEmail == email);

        var reject = await admin.PutAsync($"/GuardianRequests/{req.Id}/reject", null);
        reject.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = await um.FindByEmailAsync(email);
        _userIdsToDelete.Add(user!.Id);

        (await db.MemberGuardians.AnyAsync(g => g.MemberId == memberId && g.GuardianAppUserId == user.Id))
            .Should().BeFalse();
        var reloaded = await db.GuardianRequests.FirstAsync(r => r.Id == req.Id);
        reloaded.Status.Should().Be(GuardianRequestStatus.Rejected);
    }

    [Fact]
    public async Task Create_rejects_duplicate_pending_request()
    {
        var memberId = await SeedMemberAsync();
        var admin = await AdminClientAsync();
        var code = await IssueInviteCodeAsync(admin, memberId);

        var email = $"dup-{Guid.NewGuid():N}@test.example";
        var anon = _factory.CreateClient();

        var first = await anon.PostAsJsonAsync("/GuardianRequests", new { Email = email, Code = code });
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var user = await um.FindByEmailAsync(email);
            _userIdsToDelete.Add(user!.Id);
        }

        var second = await anon.PostAsJsonAsync("/GuardianRequests", new { Email = email, Code = code });
        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RevokeInviteCode_blocks_new_requests()
    {
        var memberId = await SeedMemberAsync();
        var admin = await AdminClientAsync();
        var code = await IssueInviteCodeAsync(admin, memberId);

        var revoke = await admin.DeleteAsync($"/Members/{memberId}/guardian-invite-code");
        revoke.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var anon = _factory.CreateClient();
        var resp = await anon.PostAsJsonAsync("/GuardianRequests",
            new { Email = $"revoked-{Guid.NewGuid():N}@test.example", Code = code });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
