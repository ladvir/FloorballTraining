using System.Net;
using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

[Collection("Api")]
public class AuthFlowTests
{
    private readonly CustomWebApplicationFactory _factory;

    // Seeded by Program.cs at startup.
    private const string AdminEmail = "admin@flotr.cz";
    private const string AdminPassword = "Admin123!";

    public AuthFlowTests(CustomWebApplicationFactory factory) => _factory = factory;

    private record LoginBody(string Email, string Password);

    [Fact]
    public async Task Login_with_seeded_admin_returns_token_and_admin_role()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/Auth/login", new LoginBody(AdminEmail, AdminPassword));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<AuthResponseModel>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.Email.Should().Be(AdminEmail);
        body.Roles.Should().Contain("Admin");
    }

    [Fact]
    public async Task Login_with_wrong_password_is_unauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/Auth/login", new LoginBody(AdminEmail, "wrong-password"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_without_token_is_unauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/Auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_with_token_returns_current_user()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.GetAsync("/Auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Me_AccountType_IsCoachForAdmin_AndPlayerForPlainUser()
    {
        var admin = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(admin);
        admin.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);
        var adminBody = await admin.GetFromJsonAsync<AuthResponseModel>("/Auth/me");
        adminBody!.AccountType.Should().Be("Coach");

        var email = $"acct-{Guid.NewGuid():N}@test.example";
        const string password = "Test123!";
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var club = new Club { Name = $"AcctClub-{Guid.NewGuid():N}" };
            db.Clubs.Add(club);
            await db.SaveChangesAsync();

            var user = new AppUser { UserName = email, Email = email, FirstName = "Acct", LastName = "Player", DefaultClubId = club.Id };
            (await um.CreateAsync(user, password)).Succeeded.Should().BeTrue();
            db.Members.Add(new Member
            {
                FirstName = "Acct", LastName = "Player", Email = email, BirthYear = 2010,
                ClubId = club.Id, AppUserId = user.Id
            });
            await db.SaveChangesAsync();
        }

        var player = _factory.CreateClient();
        var playerToken = await LoginHelper.GetTokenAsync(player, email, password);
        player.DefaultRequestHeaders.Authorization = new("Bearer", playerToken);
        var playerBody = await player.GetFromJsonAsync<AuthResponseModel>("/Auth/me");
        playerBody!.AccountType.Should().Be("Player");
    }
}
