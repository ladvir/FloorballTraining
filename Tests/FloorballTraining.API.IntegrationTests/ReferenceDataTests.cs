using System.Net;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>Smoke coverage of read-heavy reference endpoints (also cached in B7/#14).</summary>
[Collection("Api")]
public class ReferenceDataTests
{
    private readonly CustomWebApplicationFactory _factory;

    public ReferenceDataTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Theory]
    [InlineData("/Tags/all")]
    [InlineData("/Equipments/all")]
    [InlineData("/AgeGroups/all")]
    [InlineData("/Places/all")]
    public async Task Reference_list_endpoints_return_ok_for_authenticated_user(string url)
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.GetAsync(url);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
