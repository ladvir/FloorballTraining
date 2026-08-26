using System.Net;
using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Anyone with edit rights (i.e. any authenticated user — creating an Activity/Training carries no
/// role restriction either) can add a new Tag inline from the Activity/Training form; only Admin
/// can delete one. See TagsController.Create/Delete.
/// </summary>
[Collection("Api")]
public class TagPermissionsTests
{
    private readonly CustomWebApplicationFactory _factory;

    public TagPermissionsTests(CustomWebApplicationFactory factory) => _factory = factory;

    private async Task<string> CreateNonAdminUserAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var email = $"tagperm-{Guid.NewGuid():N}@test.example";
        var user = new AppUser { UserName = email, Email = email, FirstName = "Tag", LastName = "Editor" };
        (await userManager.CreateAsync(user, "Password123!")).Succeeded.Should().BeTrue();
        return email;
    }

    [Fact]
    public async Task NonAdmin_can_create_a_tag()
    {
        var client = _factory.CreateClient();
        var email = await CreateNonAdminUserAsync();
        var token = await LoginHelper.GetTokenAsync(client, email, "Password123!");
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.PostAsJsonAsync("/tags", new TagDto { Name = $"NonAdminTag-{Guid.NewGuid():N}" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task NonAdmin_cannot_delete_a_tag()
    {
        var client = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);
        var created = await client.PostAsJsonAsync("/tags", new TagDto { Name = $"ToDelete-{Guid.NewGuid():N}" });
        var tag = await created.Content.ReadFromJsonAsync<TagDto>();

        var email = await CreateNonAdminUserAsync();
        var token = await LoginHelper.GetTokenAsync(client, email, "Password123!");
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var response = await client.DeleteAsync($"/tags/{tag!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_can_delete_a_tag()
    {
        var client = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);
        var created = await client.PostAsJsonAsync("/tags", new TagDto { Name = $"AdminDelete-{Guid.NewGuid():N}" });
        var tag = await created.Content.ReadFromJsonAsync<TagDto>();

        var response = await client.DeleteAsync($"/tags/{tag!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
