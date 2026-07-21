using System.Net;
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
/// Player skill card API (#80): roster scoping (Admin/ClubAdmin/HeadCoach = club-wide,
/// Coach = own teams only), card + history reads (players may browse teammates'
/// cards read-only), batch save (Coach-and-above only, insert-only history), and
/// grade/target range validation. Also covers the #91 explicit player-role endpoint
/// (MemberPlayerRole: FieldPlayer/Goalkeeper/Both, same Trenér+ write scoping).
/// </summary>
[Collection("Api")]
public class PlayerSkillsControllerTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";

    private readonly string _headCoachEmail = $"ps-hc-{Guid.NewGuid():N}@test.example";
    private readonly string _teamACoachEmail = $"ps-coachA-{Guid.NewGuid():N}@test.example";
    private readonly string _teamBCoachEmail = $"ps-coachB-{Guid.NewGuid():N}@test.example";
    private readonly string _foreignCoachEmail = $"ps-foreign-{Guid.NewGuid():N}@test.example";
    private readonly string _player1Email = $"ps-player1-{Guid.NewGuid():N}@test.example";
    private readonly string _player2Email = $"ps-player2-{Guid.NewGuid():N}@test.example";

    private int _clubId;
    private int _teamAId;
    private int _teamBId;
    private int _player1Id;
    private int _player2Id;
    private int _skillCategoryId;
    private int _skill1Id;
    private int _skill2Id;
    private int _goalkeeperCategoryId;
    private int _goalkeeperSkillId;

    public PlayerSkillsControllerTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"PsClub-{Guid.NewGuid():N}" };
        var foreignClub = new Club { Name = $"PsForeign-{Guid.NewGuid():N}" };
        db.Clubs.AddRange(club, foreignClub);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var teamA = new Team { Name = $"PsTeamA-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        var teamB = new Team { Name = $"PsTeamB-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.AddRange(teamA, teamB);
        await db.SaveChangesAsync();
        _teamAId = teamA.Id;
        _teamBId = teamB.Id;

        var player1 = new Member { FirstName = "Ps", LastName = "Player1", BirthYear = 2010, ClubId = _clubId };
        var player2 = new Member { FirstName = "Ps", LastName = "Player2", BirthYear = 2011, ClubId = _clubId };
        db.Members.AddRange(player1, player2);
        await db.SaveChangesAsync();
        _player1Id = player1.Id;
        _player2Id = player2.Id;
        db.TeamMembers.Add(new TeamMember { TeamId = _teamAId, MemberId = _player1Id, IsPlayer = true });
        db.TeamMembers.Add(new TeamMember { TeamId = _teamAId, MemberId = _player2Id, IsPlayer = true });

        var category = new SkillCategory { Name = $"PsCategory-{Guid.NewGuid():N}", Position = SkillCategoryPosition.FieldPlayer, SortOrder = 1 };
        db.SkillCategories.Add(category);
        await db.SaveChangesAsync();
        _skillCategoryId = category.Id;

        var skill1 = new Skill { SkillCategoryId = _skillCategoryId, Name = "PsSkill1", SortOrder = 1 };
        var skill2 = new Skill { SkillCategoryId = _skillCategoryId, Name = "PsSkill2", SortOrder = 2 };
        db.Skills.AddRange(skill1, skill2);
        await db.SaveChangesAsync();
        _skill1Id = skill1.Id;
        _skill2Id = skill2.Id;

        var goalkeeperCategory = new SkillCategory { Name = $"PsGkCategory-{Guid.NewGuid():N}", Position = SkillCategoryPosition.Goalkeeper, SortOrder = 1 };
        db.SkillCategories.Add(goalkeeperCategory);
        await db.SaveChangesAsync();
        _goalkeeperCategoryId = goalkeeperCategory.Id;

        var goalkeeperSkill = new Skill { SkillCategoryId = _goalkeeperCategoryId, Name = "PsGkSkill1", SortOrder = 1 };
        db.Skills.Add(goalkeeperSkill);
        await db.SaveChangesAsync();
        _goalkeeperSkillId = goalkeeperSkill.Id;

        // Head coach: club-wide access.
        var headCoach = new AppUser { UserName = _headCoachEmail, Email = _headCoachEmail, FirstName = "Ps", LastName = "HeadCoach", DefaultClubId = _clubId };
        (await um.CreateAsync(headCoach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Ps", LastName = "HeadCoach", Email = _headCoachEmail, BirthYear = 1985,
            ClubId = _clubId, AppUserId = headCoach.Id, HasClubRoleMainCoach = true
        });

        // Coach assigned to team A only.
        var teamACoach = new AppUser { UserName = _teamACoachEmail, Email = _teamACoachEmail, FirstName = "Ps", LastName = "CoachA", DefaultClubId = _clubId };
        (await um.CreateAsync(teamACoach, TestPassword)).Succeeded.Should().BeTrue();
        var teamACoachMember = new Member
        {
            FirstName = "Ps", LastName = "CoachA", Email = _teamACoachEmail, BirthYear = 1985,
            ClubId = _clubId, AppUserId = teamACoach.Id, HasClubRoleCoach = true
        };
        db.Members.Add(teamACoachMember);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = _teamAId, MemberId = teamACoachMember.Id, IsCoach = true });

        // Coach assigned to team B only — must NOT reach team A's players.
        var teamBCoach = new AppUser { UserName = _teamBCoachEmail, Email = _teamBCoachEmail, FirstName = "Ps", LastName = "CoachB", DefaultClubId = _clubId };
        (await um.CreateAsync(teamBCoach, TestPassword)).Succeeded.Should().BeTrue();
        var teamBCoachMember = new Member
        {
            FirstName = "Ps", LastName = "CoachB", Email = _teamBCoachEmail, BirthYear = 1985,
            ClubId = _clubId, AppUserId = teamBCoach.Id, HasClubRoleCoach = true
        };
        db.Members.Add(teamBCoachMember);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = _teamBId, MemberId = teamBCoachMember.Id, IsCoach = true });

        // Coach of a different club entirely.
        var foreignCoach = new AppUser { UserName = _foreignCoachEmail, Email = _foreignCoachEmail, FirstName = "Foreign", LastName = "Coach", DefaultClubId = foreignClub.Id };
        (await um.CreateAsync(foreignCoach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Foreign", LastName = "Coach", Email = _foreignCoachEmail, BirthYear = 1985,
            ClubId = foreignClub.Id, AppUserId = foreignCoach.Id, HasClubRoleCoach = true
        });

        // Player1 and Player2's own logins (plain "User" effective role).
        var player1User = new AppUser { UserName = _player1Email, Email = _player1Email, FirstName = "Ps", LastName = "Player1", DefaultClubId = _clubId };
        (await um.CreateAsync(player1User, TestPassword)).Succeeded.Should().BeTrue();
        player1.AppUserId = player1User.Id;
        player1.Email = _player1Email;

        var player2User = new AppUser { UserName = _player2Email, Email = _player2Email, FirstName = "Ps", LastName = "Player2", DefaultClubId = _clubId };
        (await um.CreateAsync(player2User, TestPassword)).Succeeded.Should().BeTrue();
        player2.AppUserId = player2User.Id;
        player2.Email = _player2Email;

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

    [Fact]
    public async Task Card_ReturnsCategoriesAndSkills_WithLatestRating()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        (await headCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}", new PlayerSkillBatchUpdateDto
        {
            Items = [new PlayerSkillBatchItemDto { SkillId = _skill1Id, Grade = 3, TargetGrade = 1, Recommendation = "Nacvičit víc" }]
        })).EnsureSuccessStatusCode();

        var card = await headCoach.GetFromJsonAsync<PlayerSkillCardDto>($"/playerskills/member/{_player1Id}");

        card!.MemberId.Should().Be(_player1Id);
        card.Position.Should().Be("FieldPlayer");
        var category = card.Categories.Single(c => c.CategoryId == _skillCategoryId);
        var skill1 = category.Skills.Single(s => s.SkillId == _skill1Id);
        skill1.Grade.Should().Be(3);
        skill1.TargetGrade.Should().Be(1);
        skill1.Recommendation.Should().Be("Nacvičit víc");
        var skill2 = category.Skills.Single(s => s.SkillId == _skill2Id);
        skill2.Grade.Should().BeNull("skill2 was never rated");

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db.AuditLogs.AnyAsync(a =>
                a.Action == "PlayerSkillCard.Viewed" && a.EntityId == _player1Id.ToString()))
            .Should().BeTrue();
    }

    [Fact]
    public async Task Card_ForeignClubCoach_IsForbidden()
    {
        var foreignCoach = await ClientFor(_foreignCoachEmail);
        (await foreignCoach.GetAsync($"/playerskills/member/{_player1Id}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Save_CoachOutsideOwnTeam_IsForbidden()
    {
        var teamBCoach = await ClientFor(_teamBCoachEmail);

        (await teamBCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}", new PlayerSkillBatchUpdateDto
        {
            Items = [new PlayerSkillBatchItemDto { SkillId = _skill1Id, Grade = 2 }]
        })).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Same coach can save for their own team's players — sanity check the restriction is team-based, not blanket.
        var teamACoach = await ClientFor(_teamACoachEmail);
        (await teamACoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}", new PlayerSkillBatchUpdateDto
        {
            Items = [new PlayerSkillBatchItemDto { SkillId = _skill1Id, Grade = 2 }]
        })).EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Player_CanReadTeammateCard_ButCannotWrite()
    {
        var player1 = await ClientFor(_player1Email);

        // Player1 reads Player2's card (a teammate's, not their own) — read succeeds.
        (await player1.GetAsync($"/playerskills/member/{_player2Id}")).EnsureSuccessStatusCode();

        // But any write attempt is forbidden, even on their own card.
        (await player1.PutAsJsonAsync($"/playerskills/member/{_player1Id}", new PlayerSkillBatchUpdateDto
        {
            Items = [new PlayerSkillBatchItemDto { SkillId = _skill1Id, Grade = 3 }]
        })).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Save_InsertsNewHistoryRow_AndKeepsOldOnes()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        (await headCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}", new PlayerSkillBatchUpdateDto
        {
            Items = [new PlayerSkillBatchItemDto { SkillId = _skill1Id, Grade = 4 }]
        })).EnsureSuccessStatusCode();

        (await headCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}", new PlayerSkillBatchUpdateDto
        {
            Items = [new PlayerSkillBatchItemDto { SkillId = _skill1Id, Grade = 2 }]
        })).EnsureSuccessStatusCode();

        var history = await headCoach.GetFromJsonAsync<List<PlayerSkillHistoryEntryDto>>(
            $"/playerskills/member/{_player1Id}/skill/{_skill1Id}/history");
        history.Should().HaveCount(2, "the batch save must insert, never overwrite, history rows");
        history![0].Grade.Should().Be(4);
        history[1].Grade.Should().Be(2);

        var card = await headCoach.GetFromJsonAsync<PlayerSkillCardDto>($"/playerskills/member/{_player1Id}");
        var skill1 = card!.Categories.Single(c => c.CategoryId == _skillCategoryId).Skills.Single(s => s.SkillId == _skill1Id);
        skill1.Grade.Should().Be(2, "the card must show the most recently rated grade");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public async Task Save_GradeOutOfRange_ReturnsBadRequest(int invalidGrade)
    {
        var headCoach = await ClientFor(_headCoachEmail);

        (await headCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}", new PlayerSkillBatchUpdateDto
        {
            Items = [new PlayerSkillBatchItemDto { SkillId = _skill1Id, Grade = invalidGrade }]
        })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Roster_ScopesToOwnTeam_ForCoach_AndClubWide_ForHeadCoach()
    {
        var teamACoach = await ClientFor(_teamACoachEmail);
        var teamARoster = await teamACoach.GetFromJsonAsync<List<PlayerSkillRosterMemberDto>>("/playerskills/roster");
        teamARoster!.Select(r => r.MemberId).Should().BeEquivalentTo([_player1Id, _player2Id]);

        var teamBCoach = await ClientFor(_teamBCoachEmail);
        var teamBRoster = await teamBCoach.GetFromJsonAsync<List<PlayerSkillRosterMemberDto>>("/playerskills/roster");
        teamBRoster.Should().BeEmpty("team B has no players assigned");

        var headCoach = await ClientFor(_headCoachEmail);
        var fullRoster = await headCoach.GetFromJsonAsync<List<PlayerSkillRosterMemberDto>>("/playerskills/roster");
        fullRoster!.Select(r => r.MemberId).Should().BeEquivalentTo([_player1Id, _player2Id]);
    }

    [Fact]
    public async Task Roster_PlainPlayer_IsForbidden()
    {
        var player1 = await ClientFor(_player1Email);
        (await player1.GetAsync("/playerskills/roster")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Card_UnsetRole_FallsBackToLineupInference_AndExplicitRoleIsNull()
    {
        var headCoach = await ClientFor(_headCoachEmail);
        var card = await headCoach.GetFromJsonAsync<PlayerSkillCardDto>($"/playerskills/member/{_player1Id}");

        card!.Position.Should().Be("FieldPlayer", "no lineup history and no explicit role both default to FieldPlayer");
        card.ExplicitRole.Should().BeNull("no MemberPlayerRole row exists yet");
    }

    [Fact]
    public async Task UpdateRole_ExplicitGoalkeeper_OverridesInference_AndCardShowsGoalkeeperCategories()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        var updated = await headCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}/role",
            new UpdateMemberSkillPositionDto { Position = "Goalkeeper" });
        updated.EnsureSuccessStatusCode();

        var card = await headCoach.GetFromJsonAsync<PlayerSkillCardDto>($"/playerskills/member/{_player1Id}");
        card!.Position.Should().Be("Goalkeeper");
        card.ExplicitRole.Should().Be("Goalkeeper");
        card.Categories.Should().OnlyContain(c => c.Position == "Goalkeeper");
        card.Categories.Should().Contain(c => c.CategoryId == _goalkeeperCategoryId);
    }

    [Fact]
    public async Task UpdateRole_Both_ReturnsCategoriesFromBothPositions()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        (await headCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}/role",
            new UpdateMemberSkillPositionDto { Position = "Both" })).EnsureSuccessStatusCode();

        var card = await headCoach.GetFromJsonAsync<PlayerSkillCardDto>($"/playerskills/member/{_player1Id}");
        card!.Position.Should().Be("Both");
        card.ExplicitRole.Should().Be("Both");
        card.Categories.Should().Contain(c => c.CategoryId == _skillCategoryId && c.Position == "FieldPlayer");
        card.Categories.Should().Contain(c => c.CategoryId == _goalkeeperCategoryId && c.Position == "Goalkeeper");
    }

    [Fact]
    public async Task UpdateRole_InvalidPosition_ReturnsBadRequest()
    {
        var headCoach = await ClientFor(_headCoachEmail);

        (await headCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}/role",
            new UpdateMemberSkillPositionDto { Position = "NotAPosition" }))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateRole_PlainPlayer_IsForbidden()
    {
        var player1 = await ClientFor(_player1Email);

        (await player1.PutAsJsonAsync($"/playerskills/member/{_player1Id}/role",
            new UpdateMemberSkillPositionDto { Position = "Goalkeeper" }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateRole_CoachOutsideOwnTeam_IsForbidden_ButOwnTeamCoachSucceeds()
    {
        var teamBCoach = await ClientFor(_teamBCoachEmail);
        (await teamBCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}/role",
            new UpdateMemberSkillPositionDto { Position = "Goalkeeper" }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var teamACoach = await ClientFor(_teamACoachEmail);
        (await teamACoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}/role",
            new UpdateMemberSkillPositionDto { Position = "Goalkeeper" }))
            .EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task UpdateRole_ForeignClubCoach_IsForbidden()
    {
        var foreignCoach = await ClientFor(_foreignCoachEmail);
        (await foreignCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}/role",
            new UpdateMemberSkillPositionDto { Position = "Goalkeeper" }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateRole_IsAuditLogged()
    {
        var headCoach = await ClientFor(_headCoachEmail);
        (await headCoach.PutAsJsonAsync($"/playerskills/member/{_player1Id}/role",
            new UpdateMemberSkillPositionDto { Position = "Both" })).EnsureSuccessStatusCode();

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db.AuditLogs.AnyAsync(a =>
                a.Action == "MemberSkillPosition.Updated" && a.EntityId == _player1Id.ToString()))
            .Should().BeTrue();
    }
}
