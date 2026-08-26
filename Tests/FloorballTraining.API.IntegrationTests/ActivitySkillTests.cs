using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>Activity → Skill link (#163): create/edit round-trip and the SkillIds library filter.</summary>
[Collection("Api")]
public class ActivitySkillTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private int _skillAId;
    private int _skillBId;

    public ActivitySkillTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var category = new SkillCategory { Name = $"AsCategory-{Guid.NewGuid():N}", Position = SkillCategoryPosition.FieldPlayer, SortOrder = 1 };
        db.SkillCategories.Add(category);
        await db.SaveChangesAsync();

        var skillA = new Skill { SkillCategoryId = category.Id, Name = "AsSkillA", SortOrder = 1 };
        var skillB = new Skill { SkillCategoryId = category.Id, Name = "AsSkillB", SortOrder = 2 };
        db.Skills.AddRange(skillA, skillB);
        await db.SaveChangesAsync();
        _skillAId = skillA.Id;
        _skillBId = skillB.Id;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task Create_PersistsSkillLink_AndGetReturnsIt()
    {
        var client = await AdminClientAsync();

        var dto = new ActivityDto
        {
            Name = $"AsActivity-{Guid.NewGuid():N}",
            DurationMin = 5,
            DurationMax = 10,
            PersonsMin = 4,
            PersonsMax = 12,
            ActivitySkills = [new ActivitySkillDto { SkillId = _skillAId }],
        };

        var createResponse = await client.PostAsJsonAsync("/activities", dto);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ActivityDto>();

        var fetched = await client.GetFromJsonAsync<ActivityDto>($"/activities/{created!.Id}");

        fetched!.ActivitySkills.Should().ContainSingle(s => s.SkillId == _skillAId && s.SkillName == "AsSkillA");
    }

    [Fact]
    public async Task Update_ReplacesSkillLink()
    {
        var client = await AdminClientAsync();

        var created = await (await client.PostAsJsonAsync("/activities", new ActivityDto
        {
            Name = $"AsActivity-{Guid.NewGuid():N}",
            DurationMin = 5,
            DurationMax = 10,
            PersonsMin = 4,
            PersonsMax = 12,
            ActivitySkills = [new ActivitySkillDto { SkillId = _skillAId }],
        })).Content.ReadFromJsonAsync<ActivityDto>();

        created!.ActivitySkills = [new ActivitySkillDto { SkillId = _skillBId }];
        (await client.PutAsJsonAsync($"/activities/{created.Id}", created)).EnsureSuccessStatusCode();

        var fetched = await client.GetFromJsonAsync<ActivityDto>($"/activities/{created.Id}");

        fetched!.ActivitySkills.Should().ContainSingle(s => s.SkillId == _skillBId);
        fetched.ActivitySkills.Should().NotContain(s => s.SkillId == _skillAId);
    }

    [Fact]
    public async Task Index_FiltersBySkillIds()
    {
        var client = await AdminClientAsync();

        var name = $"AsFilterActivity-{Guid.NewGuid():N}";
        (await client.PostAsJsonAsync("/activities", new ActivityDto
        {
            Name = name,
            DurationMin = 5,
            DurationMax = 10,
            PersonsMin = 4,
            PersonsMax = 12,
            ActivitySkills = [new ActivitySkillDto { SkillId = _skillAId }],
        })).EnsureSuccessStatusCode();

        var matching = await client.GetFromJsonAsync<PaginationResponse<ActivityDto>>(
            $"/activities?SkillIds={_skillAId}&PageSize=200");
        matching!.Data.Should().Contain(a => a.Name == name);

        // No activity references skillB yet — Index returns 404 for an empty result set (same
        // convention as every other filter on this endpoint), not an empty 200 page.
        var nonMatchingResponse = await client.GetAsync($"/activities?SkillIds={_skillBId}&PageSize=200");
        nonMatchingResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }

    private class PaginationResponse<T>
    {
        public List<T> Data { get; set; } = [];
    }
}
