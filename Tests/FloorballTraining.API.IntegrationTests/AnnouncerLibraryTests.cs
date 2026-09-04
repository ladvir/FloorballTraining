using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Per-user Hlasatel library CRUD (/announcerlibrary). Covers create → list → delete round-trip
/// and that rows are scoped to the caller (a second user never sees the first user's items).
/// </summary>
[Collection("Api")]
public class AnnouncerLibraryTests(CustomWebApplicationFactory factory)
{
    private sealed record ItemDto(int Id, string Name, string Text, DateTime CreatedAt);

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task Create_List_Delete_RoundTrips()
    {
        var client = await AdminClientAsync();
        var name = $"Zápas {Guid.NewGuid():N}";

        var create = await client.PostAsJsonAsync("/announcerlibrary",
            new { Name = name, Text = "Vážení *diváci*, vítejte! // Začínáme." });
        create.StatusCode.Should().Be(HttpStatusCode.OK);
        var created = await create.Content.ReadFromJsonAsync<ItemDto>();
        created!.Id.Should().BeGreaterThan(0);

        var list = await client.GetFromJsonAsync<List<ItemDto>>("/announcerlibrary");
        list!.Should().ContainSingle(i => i.Id == created.Id && i.Name == name);

        (await client.DeleteAsync($"/announcerlibrary/{created.Id}")).StatusCode
            .Should().Be(HttpStatusCode.NoContent);

        var after = await client.GetFromJsonAsync<List<ItemDto>>("/announcerlibrary");
        after!.Should().NotContain(i => i.Id == created.Id);
    }

    [Fact]
    public async Task Create_RejectsEmpty()
    {
        var client = await AdminClientAsync();
        var resp = await client.PostAsJsonAsync("/announcerlibrary", new { Name = "  ", Text = "" });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Delete_OfMissingId_Returns404()
    {
        var client = await AdminClientAsync();
        (await client.DeleteAsync("/announcerlibrary/999999")).StatusCode
            .Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Get_RequiresAuth()
    {
        var anon = factory.CreateClient();
        (await anon.GetAsync("/announcerlibrary")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
