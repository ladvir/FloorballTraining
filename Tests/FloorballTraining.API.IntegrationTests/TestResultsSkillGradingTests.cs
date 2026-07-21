using System.Net.Http.Json;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Test-backed skill grading (#92): recording a TestResult for a test linked to a Skill
/// auto-derives a 1-5 grade and inserts a PlayerSkillRating (Create/CreateBatch only —
/// Update/Delete never rewrite or delete a derived rating, see TestResultsController docs).
/// </summary>
[Collection("Api")]
public class TestResultsSkillGradingTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";

    private readonly string _headCoachEmail = $"trsg-hc-{Guid.NewGuid():N}@test.example";

    private int _clubId;
    private int _playerId;
    private int _skillId;
    private int _numberTestId;
    private int _gradeTestId;
    private int _gradeOptionSkillGrade3Id;
    private int _unlinkedTestId;

    public TestResultsSkillGradingTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"TrsgClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var team = new Team { Name = $"TrsgTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var player = new Member { FirstName = "Trsg", LastName = "Player", BirthYear = 2010, ClubId = _clubId };
        db.Members.Add(player);
        await db.SaveChangesAsync();
        _playerId = player.Id;
        db.TeamMembers.Add(new TeamMember { TeamId = team.Id, MemberId = _playerId, IsPlayer = true });

        var category = new SkillCategory { Name = $"TrsgCategory-{Guid.NewGuid():N}", Position = SkillCategoryPosition.FieldPlayer, SortOrder = 1 };
        db.SkillCategories.Add(category);
        await db.SaveChangesAsync();

        var skill = new Skill { SkillCategoryId = category.Id, Name = "TrsgSkill", SortOrder = 1 };
        db.Skills.Add(skill);
        await db.SaveChangesAsync();
        _skillId = skill.Id;

        // Number-type test linked to the skill, with an exact age-group band (grade1 0-10, grade2 10-20, grade3 20-30, grade4 30-40, else 5).
        var numberTest = new TestDefinition
        {
            Name = $"TrsgNumberTest-{Guid.NewGuid():N}",
            TestType = TestType.Number,
            Category = TestCategory.Conditioning,
            HigherIsBetter = false,
            SkillId = _skillId,
            SkillGradeRanges =
            [
                new TestSkillGradeRange
                {
                    AgeGroupId = 1,
                    Grade1From = 0, Grade1To = 10,
                    Grade2From = 10, Grade2To = 20,
                    Grade3From = 20, Grade3To = 30,
                    Grade4From = 30, Grade4To = 40,
                }
            ]
        };
        db.TestDefinitions.Add(numberTest);
        await db.SaveChangesAsync();
        _numberTestId = numberTest.Id;

        // Grade-type test linked to the same skill; one option maps to skill grade 3.
        var gradeTest = new TestDefinition
        {
            Name = $"TrsgGradeTest-{Guid.NewGuid():N}",
            TestType = TestType.Grade,
            Category = TestCategory.Technique,
            SkillId = _skillId,
            GradeOptions =
            [
                new GradeOption { Label = "Weak", NumericValue = 1, SortOrder = 1, SkillGrade = 5 },
                new GradeOption { Label = "Solid", NumericValue = 2, SortOrder = 2, SkillGrade = 3 },
            ]
        };
        db.TestDefinitions.Add(gradeTest);
        await db.SaveChangesAsync();
        _gradeTestId = gradeTest.Id;
        _gradeOptionSkillGrade3Id = gradeTest.GradeOptions.Single(g => g.SkillGrade == 3).Id;

        // Unlinked test — control case, must never touch PlayerSkillRatings.
        var unlinkedTest = new TestDefinition
        {
            Name = $"TrsgUnlinkedTest-{Guid.NewGuid():N}",
            TestType = TestType.Number,
            Category = TestCategory.Conditioning,
            HigherIsBetter = true,
        };
        db.TestDefinitions.Add(unlinkedTest);
        await db.SaveChangesAsync();
        _unlinkedTestId = unlinkedTest.Id;

        var headCoach = new AppUser { UserName = _headCoachEmail, Email = _headCoachEmail, FirstName = "Trsg", LastName = "HeadCoach", DefaultClubId = _clubId };
        (await um.CreateAsync(headCoach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Trsg", LastName = "HeadCoach", Email = _headCoachEmail, BirthYear = 1985,
            ClubId = _clubId, AppUserId = headCoach.Id, HasClubRoleMainCoach = true
        });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<HttpClient> ClientFor(string email)
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private record BatchCreateResponse(int Count, int SkillGradesUpdated);

    [Fact]
    public async Task Create_NumberTypeTestLinkedToSkill_DerivesGradeAndInsertsRating()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        var response = await headCoach.PostAsJsonAsync("/testresults", new TestResultDto
        {
            TestDefinitionId = _numberTestId,
            MemberId = _playerId,
            NumericValue = 15, // falls in band 2 (10-20)
            TestDate = DateTime.UtcNow.Date,
        });
        response.EnsureSuccessStatusCode();

        var dto = await response.Content.ReadFromJsonAsync<TestResultDto>();
        dto!.DerivedSkillGrade.Should().Be(2);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var rating = await db.PlayerSkillRatings
            .Where(r => r.MemberId == _playerId && r.SkillId == _skillId)
            .OrderByDescending(r => r.RatedAt)
            .FirstAsync();

        rating.Grade.Should().Be(2);
        rating.SourceTestResultId.Should().Be(dto.Id);
        rating.Recommendation.Should().Contain(dto.TestName ?? "");
    }

    [Fact]
    public async Task Create_GradeTypeTestLinkedToSkill_UsesGradeOptionSkillGrade()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        var response = await headCoach.PostAsJsonAsync("/testresults", new TestResultDto
        {
            TestDefinitionId = _gradeTestId,
            MemberId = _playerId,
            GradeOptionId = _gradeOptionSkillGrade3Id,
            TestDate = DateTime.UtcNow.Date,
        });
        response.EnsureSuccessStatusCode();

        var dto = await response.Content.ReadFromJsonAsync<TestResultDto>();
        dto!.DerivedSkillGrade.Should().Be(3);
    }

    [Fact]
    public async Task Create_UnlinkedTest_DoesNotCreateSkillRating()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            (await db.PlayerSkillRatings.CountAsync(r => r.MemberId == _playerId)).Should().Be(0);
        }

        var response = await headCoach.PostAsJsonAsync("/testresults", new TestResultDto
        {
            TestDefinitionId = _unlinkedTestId,
            MemberId = _playerId,
            NumericValue = 42,
            TestDate = DateTime.UtcNow.Date,
        });
        response.EnsureSuccessStatusCode();

        var dto = await response.Content.ReadFromJsonAsync<TestResultDto>();
        dto!.DerivedSkillGrade.Should().BeNull();

        await using var scope2 = _factory.Services.CreateAsyncScope();
        var db2 = scope2.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db2.PlayerSkillRatings.CountAsync(r => r.MemberId == _playerId)).Should().Be(0);
    }

    [Fact]
    public async Task CreateBatch_ReturnsSkillGradesUpdatedCount()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        var response = await headCoach.PostAsJsonAsync("/testresults/batch", new List<TestResultDto>
        {
            new()
            {
                TestDefinitionId = _numberTestId,
                MemberId = _playerId,
                NumericValue = 5, // band 1
                TestDate = DateTime.UtcNow.Date,
            },
            new()
            {
                TestDefinitionId = _unlinkedTestId,
                MemberId = _playerId,
                NumericValue = 99,
                TestDate = DateTime.UtcNow.Date,
            },
        });
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<BatchCreateResponse>();
        result!.Count.Should().Be(2);
        result.SkillGradesUpdated.Should().Be(1);
    }

    [Fact]
    public async Task Delete_TestResultWithDerivedRating_KeepsRating_ButClearsSourceReference()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        var createResponse = await headCoach.PostAsJsonAsync("/testresults", new TestResultDto
        {
            TestDefinitionId = _numberTestId,
            MemberId = _playerId,
            NumericValue = 25, // band 3
            TestDate = DateTime.UtcNow.Date,
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<TestResultDto>();

        (await headCoach.DeleteAsync($"/testresults/{created!.Id}")).EnsureSuccessStatusCode();

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var rating = await db.PlayerSkillRatings
            .Where(r => r.MemberId == _playerId && r.SkillId == _skillId)
            .OrderByDescending(r => r.RatedAt)
            .FirstAsync();

        rating.Grade.Should().Be(3, "the historical rating survives even after its source test result is deleted");
        rating.SourceTestResultId.Should().BeNull();
        (await db.TestResults.FindAsync(created.Id)).Should().BeNull();
    }
}
