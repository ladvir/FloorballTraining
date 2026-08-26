using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Training's goal-skill (max 3, validated, #163) and unlimited supplementary TrainingTag
/// (replaces the old 3-slot TrainingGoal1/2/3) — create/update round trip via the real API,
/// covering TrainingEFCoreFactory.TrainingTagsMergeOrBuild and
/// TrainingEFCoreRepository.UpdateTrainingTags directly (not just the derived #171 aggregation).
/// </summary>
[Collection("Api")]
public class TrainingGoalSkillAndTagsTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private int _skillId;
    private int _otherSkillId;
    private int _tagAId;
    private int _tagBId;
    private int _trainingId;

    public TrainingGoalSkillAndTagsTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var category = new SkillCategory { Name = $"TgsCategory-{Guid.NewGuid():N}", Position = CoreBusiness.Enums.SkillCategoryPosition.FieldPlayer, SortOrder = 1 };
        db.SkillCategories.Add(category);
        await db.SaveChangesAsync();

        var skill = new Skill { SkillCategoryId = category.Id, Name = "TgsSkill", SortOrder = 1 };
        var otherSkill = new Skill { SkillCategoryId = category.Id, Name = "TgsOtherSkill", SortOrder = 2 };
        db.Skills.AddRange(skill, otherSkill);
        await db.SaveChangesAsync();
        _skillId = skill.Id;
        _otherSkillId = otherSkill.Id;

        var tagA = new Tag { Name = $"TgsTagA-{Guid.NewGuid():N}", IsTrainingGoal = true };
        var tagB = new Tag { Name = $"TgsTagB-{Guid.NewGuid():N}", IsTrainingGoal = true };
        db.Tags.AddRange(tagA, tagB);
        await db.SaveChangesAsync();
        _tagAId = tagA.Id;
        _tagBId = tagB.Id;

        var training = new Training
        {
            Name = $"TgsTraining-{Guid.NewGuid():N}",
            Duration = 10,
            PersonsMin = 4,
            PersonsMax = 12,
            TrainingGoalSkill1Id = _skillId,
            TrainingTags = [new TrainingTag { TagId = _tagAId }],
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
    public async Task GetById_ExposesGoalSkillAndTags_Separately()
    {
        var client = await AdminClientAsync();

        var training = await client.GetFromJsonAsync<TrainingDto>($"/trainings/{_trainingId}");

        training!.TrainingGoalSkill1!.Id.Should().Be(_skillId);
        training.TrainingTags.Should().ContainSingle(tt => tt.TagId == _tagAId);
    }

    [Fact]
    public async Task Update_ReplacesGoalSkillAndTags()
    {
        var client = await AdminClientAsync();

        var training = await client.GetFromJsonAsync<TrainingDto>($"/trainings/{_trainingId}");
        training!.TrainingGoalSkill1 = new SkillDto { Id = _otherSkillId, Name = "TgsOtherSkill", SkillCategoryId = 0 };
        // Two tags now — proving the join table isn't capped at 3 like the old TrainingGoal1/2/3.
        training.TrainingTags =
        [
            new TrainingTagDto { TagId = _tagAId, Tag = new TagDto { Id = _tagAId, Name = "TgsTagA", IsTrainingGoal = true } },
            new TrainingTagDto { TagId = _tagBId, Tag = new TagDto { Id = _tagBId, Name = "TgsTagB", IsTrainingGoal = true } },
        ];

        (await client.PutAsJsonAsync($"/trainings/{_trainingId}", training)).EnsureSuccessStatusCode();

        var updated = await client.GetFromJsonAsync<TrainingDto>($"/trainings/{_trainingId}");
        updated!.TrainingGoalSkill1!.Id.Should().Be(_otherSkillId);
        updated.TrainingTags.Select(tt => tt.TagId).Should().BeEquivalentTo([_tagAId, _tagBId]);
    }

    [Fact]
    public async Task Index_FiltersByGoalSkillId()
    {
        var client = await AdminClientAsync();

        var matching = await client.GetFromJsonAsync<PaginationResponse<TrainingDto>>(
            $"/trainings?GoalSkillId={_skillId}&PageSize=200");
        matching!.Data.Should().Contain(t => t.Id == _trainingId);

        var nonMatching = await client.GetFromJsonAsync<PaginationResponse<TrainingDto>>(
            $"/trainings?GoalSkillId={_otherSkillId}&PageSize=200");
        nonMatching!.Data.Should().NotContain(t => t.Id == _trainingId);
    }

    private class PaginationResponse<T>
    {
        public List<T> Data { get; set; } = [];
    }
}
