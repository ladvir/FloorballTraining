using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>Training-level skill aggregation + filtering, derived from its activities' ActivitySkills (#171).</summary>
[Collection("Api")]
public class TrainingSkillAggregationTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private int _skillAId;
    private int _skillBId;
    private int _trainingId;
    private string _trainingName = string.Empty;

    public TrainingSkillAggregationTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var category = new SkillCategory { Name = $"TsCategory-{Guid.NewGuid():N}", Position = SkillCategoryPosition.FieldPlayer, SortOrder = 1 };
        db.SkillCategories.Add(category);
        await db.SaveChangesAsync();

        var skillA = new Skill { SkillCategoryId = category.Id, Name = "TsSkillA", SortOrder = 1 };
        var skillB = new Skill { SkillCategoryId = category.Id, Name = "TsSkillB", SortOrder = 2 };
        db.Skills.AddRange(skillA, skillB);
        await db.SaveChangesAsync();
        _skillAId = skillA.Id;
        _skillBId = skillB.Id;

        var activity = new Activity
        {
            Name = $"TsActivity-{Guid.NewGuid():N}",
            DurationMin = 5,
            DurationMax = 10,
            PersonsMin = 4,
            PersonsMax = 12,
            ActivitySkills = [new ActivitySkill { SkillId = skillA.Id }],
        };
        db.Activities.Add(activity);
        await db.SaveChangesAsync();

        _trainingName = $"TsTraining-{Guid.NewGuid():N}";
        var training = new Training
        {
            Name = _trainingName,
            Duration = 10,
            PersonsMin = 4,
            PersonsMax = 12,
            TrainingParts =
            [
                new TrainingPart
                {
                    Duration = 10,
                    TrainingGroups = [new TrainingGroup { ActivityId = activity.Id, PersonsMax = 12 }],
                },
            ],
        };
        db.Trainings.Add(training);
        await db.SaveChangesAsync();
        _trainingId = training.Id;
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
    public async Task GetById_ExposesActivitySkills_ForAggregation()
    {
        var client = await AdminClientAsync();

        var training = await client.GetFromJsonAsync<TrainingDto>($"/trainings/{_trainingId}");

        var skillNames = training!.GetSkillNames();
        skillNames.Should().ContainSingle(n => n == "TsSkillA");
    }

    [Fact]
    public async Task GetAll_IncludesActivitySkills_ForClientSideFiltering()
    {
        var client = await AdminClientAsync();

        var trainings = await client.GetFromJsonAsync<List<TrainingDto>>("/trainings/all");

        var mine = trainings!.Single(t => t.Name == _trainingName);
        mine.GetSkillNames().Should().ContainSingle(n => n == "TsSkillA");
    }

    [Fact]
    public async Task Index_FiltersBySkillIds()
    {
        var client = await AdminClientAsync();

        var matching = await client.GetFromJsonAsync<PaginationResponse<TrainingDto>>(
            $"/trainings?SkillIds={_skillAId}&PageSize=200");
        var nonMatching = await client.GetFromJsonAsync<PaginationResponse<TrainingDto>>(
            $"/trainings?SkillIds={_skillBId}&PageSize=200");

        matching!.Data.Should().Contain(t => t.Name == _trainingName);
        nonMatching!.Data.Should().NotContain(t => t.Name == _trainingName);
    }

    private class PaginationResponse<T>
    {
        public List<T> Data { get; set; } = [];
    }
}
