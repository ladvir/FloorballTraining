using System.Net;
using System.Net.Http.Json;

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
}
