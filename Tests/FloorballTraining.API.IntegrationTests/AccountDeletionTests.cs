using System.Net;
using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

[Collection("Api")]
public class AccountDeletionTests
{
    private readonly CustomWebApplicationFactory _factory;

    private const string AdminEmail = "admin@flotr.cz";
    private const string AdminPassword = "Admin123!";

    public AccountDeletionTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task DeleteAccount_AsAdmin_IsBlocked_AndAdminCanStillLogIn()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.DeleteAsync("/Auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // The seeded admin must still be usable by every other test in this collection.
        var stillWorks = _factory.CreateClient();
        var relogin = await stillWorks.PostAsJsonAsync("/Auth/login",
            new { Email = AdminEmail, Password = AdminPassword });
        relogin.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DeleteAccount_AnonymizesMemberAndDeletesLogin_ButKeepsXpHistory()
    {
        var email = $"delete-me-{Guid.NewGuid():N}@test.example";
        const string password = "Test123!";
        int memberId;
        string userId;

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

            var club = new Club { Name = $"DeleteAcctClub-{Guid.NewGuid():N}" };
            db.Clubs.Add(club);
            await db.SaveChangesAsync();

            var user = new AppUser
            {
                UserName = email, Email = email, FirstName = "Petr", LastName = "Novák",
                DefaultClubId = club.Id,
            };
            (await um.CreateAsync(user, password)).Succeeded.Should().BeTrue();
            userId = user.Id;

            var member = new Member
            {
                FirstName = "Petr", LastName = "Novák", Email = email, BirthYear = 2010,
                ClubId = club.Id, AppUserId = user.Id,
            };
            db.Members.Add(member);
            await db.SaveChangesAsync();
            memberId = member.Id;

            // XpEvent.MemberId is a NoAction FK (kept deliberately - see TeamChallengeConfiguration
            // and XpEventConfiguration comments): a hard delete of Member would throw here. Seeding
            // one proves the anonymize-not-delete approach leaves club/team history intact.
            db.XpEvents.Add(new XpEvent
            {
                MemberId = memberId, Type = XpEventType.TrainingAttendance, Points = 10,
                SourceKind = XpSourceKind.Attendance, SourceId = 1, OccurredAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, password);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.DeleteAsync("/Auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // The deleted login no longer authenticates.
        var reloginClient = _factory.CreateClient();
        var relogin = await reloginClient.PostAsJsonAsync("/Auth/login", new { Email = email, Password = password });
        relogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        await using var verifyScope = _factory.Services.CreateAsyncScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var anonymizedMember = await verifyDb.Members.FirstAsync(m => m.Id == memberId);
        anonymizedMember.AppUserId.Should().BeNull();
        anonymizedMember.FirstName.Should().Be("Smazaný");
        anonymizedMember.Email.Should().BeEmpty();
        anonymizedMember.IsActive.Should().BeFalse();

        // Club/team history for the member survives, untouched.
        var xpEvent = await verifyDb.XpEvents.SingleOrDefaultAsync(x => x.MemberId == memberId);
        xpEvent.Should().NotBeNull();
        xpEvent!.Points.Should().Be(10);

        var deletedUser = await verifyScope.ServiceProvider.GetRequiredService<UserManager<AppUser>>()
            .FindByIdAsync(userId);
        deletedUser.Should().BeNull();
    }

    [Fact]
    public async Task DeleteUser_AdminTarget_IsBlocked()
    {
        string otherAdminId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var email = $"other-admin-{Guid.NewGuid():N}@test.example";
            var otherAdmin = new AppUser { UserName = email, Email = email, FirstName = "Other", LastName = "Admin" };
            (await um.CreateAsync(otherAdmin, "Test123!")).Succeeded.Should().BeTrue();
            (await um.AddToRoleAsync(otherAdmin, "Admin")).Succeeded.Should().BeTrue();
            otherAdminId = otherAdmin.Id;
        }

        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.DeleteAsync($"/Users/{otherAdminId}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await using var verifyScope = _factory.Services.CreateAsyncScope();
        var stillExists = await verifyScope.ServiceProvider.GetRequiredService<UserManager<AppUser>>()
            .FindByIdAsync(otherAdminId);
        stillExists.Should().NotBeNull();
    }
}
