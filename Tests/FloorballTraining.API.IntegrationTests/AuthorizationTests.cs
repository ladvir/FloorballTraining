using System.Net;

namespace FloorballTraining.API.IntegrationTests;

[Collection("Api")]
public class AuthorizationTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthorizationTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Users_list_requires_authentication()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/Users");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Users_list_is_accessible_to_admin()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.GetAsync("/Users");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
