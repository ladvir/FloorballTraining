using System.Net;
using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
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

    // A native HTTP client (React Native/axios) never sends a browser Origin header - that's
    // exactly the signal AuthController.IsNativeClient() gates on, so the default test client
    // (no Origin header) doubles as a native-client stand-in for these tests.

    [Fact]
    public async Task Login_NativeClient_ReturnsRefreshTokenInBody()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/Auth/login", new LoginBody(AdminEmail, AdminPassword));

        var body = await response.Content.ReadFromJsonAsync<AuthResponseModel>();
        body!.RefreshToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_WebClient_DoesNotReturnRefreshTokenInBody_ButSetsCookie()
    {
        var client = _factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/Auth/login")
        {
            Content = JsonContent.Create(new LoginBody(AdminEmail, AdminPassword))
        };
        request.Headers.Add("Origin", "https://localhost:3000");

        var response = await client.SendAsync(request);

        var body = await response.Content.ReadFromJsonAsync<AuthResponseModel>();
        body!.RefreshToken.Should().BeNullOrEmpty();
        response.Headers.TryGetValues("Set-Cookie", out var cookies).Should().BeTrue();
        cookies.Should().Contain(c => c.StartsWith("flotr_refresh="));
    }

    [Fact]
    public async Task Refresh_NativeClient_WithBodyToken_RotatesAndReturnsNewToken()
    {
        var loginClient = _factory.CreateClient();
        var loginResponse = await loginClient.PostAsJsonAsync("/Auth/login", new LoginBody(AdminEmail, AdminPassword));
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<AuthResponseModel>();

        // A cookie-free client proves the refresh actually came from the body fallback, not a
        // tracked cookie (the default test client auto-tracks cookies, which would mask this).
        var refreshClient = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var refreshResponse = await refreshClient.PostAsJsonAsync("/Auth/refresh",
            new { RefreshToken = loginBody!.RefreshToken });

        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var refreshBody = await refreshResponse.Content.ReadFromJsonAsync<AuthResponseModel>();
        refreshBody!.RefreshToken.Should().NotBeNullOrWhiteSpace();
        refreshBody.RefreshToken.Should().NotBe(loginBody.RefreshToken);
    }

    [Fact]
    public async Task Refresh_WithoutCookieOrBody_IsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/Auth/refresh", new { });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_WebClient_WithCookie_Rotates()
    {
        // WebApplicationFactory's default client tracks cookies across requests (HandleCookies
        // defaults to true), so it can stand in for a real browser here. BaseAddress must be
        // https:// - the refresh cookie is Secure, and CookieContainer silently drops Secure
        // cookies received over a plain http:// base address (the default).
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });
        using var loginRequest = new HttpRequestMessage(HttpMethod.Post, "/Auth/login")
        {
            Content = JsonContent.Create(new LoginBody(AdminEmail, AdminPassword))
        };
        loginRequest.Headers.Add("Origin", "https://localhost:3000");
        await client.SendAsync(loginRequest);

        using var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/Auth/refresh")
        {
            Content = JsonContent.Create(new { })
        };
        refreshRequest.Headers.Add("Origin", "https://localhost:3000");
        var refreshResponse = await client.SendAsync(refreshRequest);

        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var refreshBody = await refreshResponse.Content.ReadFromJsonAsync<AuthResponseModel>();
        refreshBody!.RefreshToken.Should().BeNullOrEmpty("web clients never get the token in the body");
    }

    [Fact]
    public async Task Logout_NativeClient_WithBodyToken_RevokesToken_SoReuseIsRejected()
    {
        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/Auth/login", new LoginBody(AdminEmail, AdminPassword));
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<AuthResponseModel>();

        var logoutResponse = await client.PostAsJsonAsync("/Auth/logout",
            new { RefreshToken = loginBody!.RefreshToken });
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var refreshResponse = await client.PostAsJsonAsync("/Auth/refresh",
            new { RefreshToken = loginBody.RefreshToken });
        refreshResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
