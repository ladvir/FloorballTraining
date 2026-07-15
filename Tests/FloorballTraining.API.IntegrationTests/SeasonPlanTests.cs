using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Season planning (periodization) API: mesocycle/microcycle CRUD, validation rules
/// (overlaps, containment, goal-tag limits), role-based access and cascade deletes.
/// </summary>
[Collection("Api")]
public class SeasonPlanTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";

    private readonly string _coachEmail = $"plan-coach-{Guid.NewGuid():N}@test.example";
    private readonly string _otherCoachEmail = $"plan-other-{Guid.NewGuid():N}@test.example";
    private readonly string _playerEmail = $"plan-player-{Guid.NewGuid():N}@test.example";

    private int _clubId;
    private int _otherClubId;
    private int _teamId;
    private List<int> _goalTagIds = [];
    private int _goalTagId1;
    private int _goalTagId2;
    private int _nonGoalTagId;

    public SeasonPlanTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"PlanClub-{Guid.NewGuid():N}" };
        var otherClub = new Club { Name = $"PlanOtherClub-{Guid.NewGuid():N}" };
        db.Clubs.AddRange(club, otherClub);
        await db.SaveChangesAsync();
        _clubId = club.Id;
        _otherClubId = otherClub.Id;

        var team = new Team { Name = $"PlanTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        _teamId = team.Id;

        var goalTags = Enumerable.Range(1, 4)
            .Select(i => new Tag { Name = $"PlanGoal{i}-{Guid.NewGuid():N}", IsTrainingGoal = true })
            .ToList();
        var nonGoalTag = new Tag { Name = $"PlanNonGoal-{Guid.NewGuid():N}", IsTrainingGoal = false };
        db.Tags.AddRange(goalTags);
        db.Tags.Add(nonGoalTag);
        await db.SaveChangesAsync();
        _goalTagIds = goalTags.Select(t => t.Id).ToList();
        _goalTagId1 = _goalTagIds[0];
        _goalTagId2 = _goalTagIds[1];
        _nonGoalTagId = nonGoalTag.Id;

        // Coach of _teamId in club
        var coach = new AppUser
        {
            UserName = _coachEmail,
            Email = _coachEmail,
            FirstName = "Plan",
            LastName = "Coach",
            DefaultClubId = _clubId
        };
        (await um.CreateAsync(coach, TestPassword)).Succeeded.Should().BeTrue();
        var coachMember = new Member
        {
            FirstName = "Plan",
            LastName = "Coach",
            Email = _coachEmail,
            BirthYear = 1990,
            ClubId = _clubId,
            AppUserId = coach.Id,
            HasClubRoleCoach = true
        };
        db.Members.Add(coachMember);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = _teamId, MemberId = coachMember.Id, IsCoach = true });

        // Coach of a DIFFERENT club — must not touch this team's plan
        var otherCoach = new AppUser
        {
            UserName = _otherCoachEmail,
            Email = _otherCoachEmail,
            FirstName = "Other",
            LastName = "Coach",
            DefaultClubId = _otherClubId
        };
        (await um.CreateAsync(otherCoach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Other",
            LastName = "Coach",
            Email = _otherCoachEmail,
            BirthYear = 1991,
            ClubId = _otherClubId,
            AppUserId = otherCoach.Id,
            HasClubRoleCoach = true
        });

        // Player in the team — read-only access
        var player = new AppUser
        {
            UserName = _playerEmail,
            Email = _playerEmail,
            FirstName = "Plan",
            LastName = "Player",
            DefaultClubId = _clubId
        };
        (await um.CreateAsync(player, TestPassword)).Succeeded.Should().BeTrue();
        var playerMember = new Member
        {
            FirstName = "Plan",
            LastName = "Player",
            Email = _playerEmail,
            BirthYear = 2005,
            ClubId = _clubId,
            AppUserId = player.Id
        };
        db.Members.Add(playerMember);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = _teamId, MemberId = playerMember.Id, IsPlayer = true });

        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        // Staged deletes: DB-side cascades (e.g. appointment → attendance) must complete
        // before restricted parents (members, teams) can go in a later batch.
        db.Mesocycles.RemoveRange(db.Mesocycles.Where(m => m.TeamId == _teamId));
        db.Appointments.RemoveRange(db.Appointments.Where(a => a.TeamId == _teamId));
        db.TestResults.RemoveRange(
            db.TestResults.Where(r => r.Member != null && r.Member.ClubId == _clubId));
        await db.SaveChangesAsync();

        db.TestDefinitions.RemoveRange(db.TestDefinitions.Where(td => td.ClubId == _clubId));
        db.TeamMembers.RemoveRange(db.TeamMembers.Where(tm => tm.TeamId == _teamId));
        await db.SaveChangesAsync();

        db.Teams.RemoveRange(db.Teams.Where(t => t.Id == _teamId));
        db.Members.RemoveRange(db.Members.Where(m => m.ClubId == _clubId || m.ClubId == _otherClubId));
        await db.SaveChangesAsync();

        db.Clubs.RemoveRange(db.Clubs.Where(c => c.Id == _clubId || c.Id == _otherClubId));
        var tagIds = _goalTagIds.Append(_nonGoalTagId).ToList();
        // Activities created by the evaluation test still link to these tags
        db.ActivityTags.RemoveRange(
            db.ActivityTags.Where(at => at.TagId != null && tagIds.Contains(at.TagId.Value)));
        db.Tags.RemoveRange(db.Tags.Where(t => tagIds.Contains(t.Id)));
        await db.SaveChangesAsync();

        foreach (var email in new[] { _coachEmail, _otherCoachEmail, _playerEmail })
        {
            var user = await um.FindByEmailAsync(email);
            if (user != null) await um.DeleteAsync(user);
        }
    }

    private async Task<HttpClient> CreateClientAsync(string email)
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private static MesocycleDto NewMesocycle(int teamId, string name, DateTime start, DateTime end) => new()
    {
        TeamId = teamId,
        Name = name,
        Phase = CoreBusiness.Enums.MesocyclePhase.Preparation,
        StartDate = start,
        EndDate = end
    };

    private async Task<MesocycleDto> CreateMesocycleAsync(HttpClient client, MesocycleDto dto)
    {
        var response = await client.PostAsJsonAsync("/SeasonPlan/mesocycles", dto);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<MesocycleDto>())!;
    }

    // ── CRUD round-trip ──────────────────────────────────────────────────────

    [Fact]
    public async Task Coach_can_create_edit_and_delete_full_plan()
    {
        var client = await CreateClientAsync(_coachEmail);

        // Create mesocycle with goal tags
        var mesoDto = NewMesocycle(_teamId, "Přípravný blok", new DateTime(2026, 7, 1), new DateTime(2026, 7, 28));
        mesoDto.Goal = "Vybudovat kondiční základ";
        mesoDto.GoalTagIds = [_goalTagId1, _goalTagId2];
        var meso = await CreateMesocycleAsync(client, mesoDto);

        meso.Id.Should().BePositive();
        meso.GoalTagIds.Should().BeEquivalentTo([_goalTagId1, _goalTagId2]);
        meso.GoalTags.Should().HaveCount(2).And.OnlyContain(t => t.IsTrainingGoal);

        // Create microcycle inside
        var microResponse = await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = meso.Id,
            Name = "Týden 1",
            Type = CoreBusiness.Enums.MicrocycleType.Development,
            StartDate = new DateTime(2026, 7, 6),
            EndDate = new DateTime(2026, 7, 12),
            GoalTagIds = [_goalTagId1]
        });
        microResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var micro = (await microResponse.Content.ReadFromJsonAsync<MicrocycleDto>())!;
        micro.GoalTagIds.Should().BeEquivalentTo([_goalTagId1]);

        // Edit microcycle (rename + retype)
        micro.Name = "Týden 1 — regenerace";
        micro.Type = CoreBusiness.Enums.MicrocycleType.Regeneration;
        var editResponse = await client.PutAsJsonAsync($"/SeasonPlan/microcycles/{micro.Id}", micro);
        editResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        (await editResponse.Content.ReadFromJsonAsync<MicrocycleDto>())!
            .Type.Should().Be(CoreBusiness.Enums.MicrocycleType.Regeneration);

        // Full plan read
        var plan = await client.GetFromJsonAsync<SeasonPlanDto>($"/SeasonPlan/team/{_teamId}");
        plan!.TeamId.Should().Be(_teamId);
        plan.Mesocycles.Should().ContainSingle(m => m.Id == meso.Id)
            .Which.Microcycles.Should().ContainSingle(mc => mc.Id == micro.Id);

        // Calendar view overlapping the microcycle
        var cycles = await client.GetFromJsonAsync<List<CycleCalendarDto>>(
            $"/SeasonPlan/calendar?teamId={_teamId}&from=2026-07-01&to=2026-07-31");
        cycles.Should().ContainSingle(c => c.MicrocycleId == micro.Id && c.MesocycleId == meso.Id);

        // Delete microcycle, then mesocycle
        (await client.DeleteAsync($"/SeasonPlan/microcycles/{micro.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var planAfter = await client.GetFromJsonAsync<SeasonPlanDto>($"/SeasonPlan/team/{_teamId}");
        planAfter!.Mesocycles.Should().BeEmpty();
    }

    [Fact]
    public async Task Cascade_delete_removes_microcycles_and_links()
    {
        var client = await CreateClientAsync(_coachEmail);

        var meso = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Cascade blok", new DateTime(2027, 1, 1), new DateTime(2027, 1, 31)));
        var microResponse = await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = meso.Id,
            Name = "Týden",
            StartDate = new DateTime(2027, 1, 5),
            EndDate = new DateTime(2027, 1, 11),
            GoalTagIds = [_goalTagId1]
        });
        var microId = (await microResponse.Content.ReadFromJsonAsync<MicrocycleDto>())!.Id;

        (await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        (await db.Microcycles.AnyAsync(mc => mc.Id == microId)).Should().BeFalse();
        (await db.MicrocycleTags.AnyAsync(t => t.MicrocycleId == microId)).Should().BeFalse();
    }

    // ── Validation ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Overlapping_mesocycles_are_rejected()
    {
        var client = await CreateClientAsync(_coachEmail);

        var meso = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Blok A", new DateTime(2028, 1, 1), new DateTime(2028, 1, 31)));

        var overlapping = await client.PostAsJsonAsync("/SeasonPlan/mesocycles",
            NewMesocycle(_teamId, "Blok B", new DateTime(2028, 1, 20), new DateTime(2028, 2, 15)));
        overlapping.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }

    [Fact]
    public async Task Microcycle_outside_mesocycle_range_is_rejected()
    {
        var client = await CreateClientAsync(_coachEmail);

        var meso = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Blok C", new DateTime(2028, 6, 1), new DateTime(2028, 6, 30)));

        var outside = await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = meso.Id,
            Name = "Mimo rozsah",
            StartDate = new DateTime(2028, 6, 25),
            EndDate = new DateTime(2028, 7, 5)
        });
        outside.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }

    [Fact]
    public async Task Goal_tags_must_be_training_goals_and_max_three()
    {
        var client = await CreateClientAsync(_coachEmail);

        var nonGoalTag = NewMesocycle(_teamId, "Blok D", new DateTime(2029, 1, 1), new DateTime(2029, 1, 31));
        nonGoalTag.GoalTagIds = [_nonGoalTagId];
        (await client.PostAsJsonAsync("/SeasonPlan/mesocycles", nonGoalTag))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var tooMany = NewMesocycle(_teamId, "Blok E", new DateTime(2029, 3, 1), new DateTime(2029, 3, 31));
        tooMany.GoalTagIds = _goalTagIds; // 4 tags > max 3
        (await client.PostAsJsonAsync("/SeasonPlan/mesocycles", tooMany))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Tag_sync_on_edit_replaces_the_set()
    {
        var client = await CreateClientAsync(_coachEmail);

        var dto = NewMesocycle(_teamId, "Blok F", new DateTime(2030, 1, 1), new DateTime(2030, 1, 31));
        dto.GoalTagIds = [_goalTagId1];
        var meso = await CreateMesocycleAsync(client, dto);

        // Replace tag1 with tag2; repeat the PUT to prove idempotence
        meso.GoalTagIds = [_goalTagId2];
        for (var i = 0; i < 2; i++)
        {
            var response = await client.PutAsJsonAsync($"/SeasonPlan/mesocycles/{meso.Id}", meso);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var updated = (await response.Content.ReadFromJsonAsync<MesocycleDto>())!;
            updated.GoalTagIds.Should().BeEquivalentTo([_goalTagId2]);
        }

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }

    [Fact]
    public async Task Shrinking_mesocycle_below_its_microcycles_is_rejected()
    {
        var client = await CreateClientAsync(_coachEmail);

        var meso = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Blok G", new DateTime(2031, 1, 1), new DateTime(2031, 1, 31)));
        (await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = meso.Id,
            Name = "Poslední týden",
            StartDate = new DateTime(2031, 1, 25),
            EndDate = new DateTime(2031, 1, 31)
        })).StatusCode.Should().Be(HttpStatusCode.OK);

        meso.EndDate = new DateTime(2031, 1, 20);
        (await client.PutAsJsonAsync($"/SeasonPlan/mesocycles/{meso.Id}", meso))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }

    // ── Week generator + ripple shift ────────────────────────────────────────

    [Fact]
    public async Task Generate_weeks_splits_mesocycle_and_conflicts_without_overwrite()
    {
        var client = await CreateClientAsync(_coachEmail);

        // Wed 8.7.2037 – Tue 21.7.2037 → 3 weeks (partial, full, partial)
        var meso = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Generovaný blok", new DateTime(2037, 7, 8), new DateTime(2037, 7, 21)));

        var generate = await client.PostAsJsonAsync($"/SeasonPlan/mesocycles/{meso.Id}/generate-weeks",
            new { type = 1, namePrefix = "Týden", overwrite = false });
        generate.StatusCode.Should().Be(HttpStatusCode.OK);
        var generated = (await generate.Content.ReadFromJsonAsync<MesocycleDto>())!;
        generated.Microcycles.Should().HaveCount(3);
        generated.Microcycles.Select(mc => mc.Name)
            .Should().ContainInOrder("Týden 1", "Týden 2", "Týden 3");
        generated.Microcycles.First().StartDate.Should().Be(new DateTime(2037, 7, 8));
        generated.Microcycles.Last().EndDate.Should().Be(new DateTime(2037, 7, 21));

        // Second run without overwrite → 409
        (await client.PostAsJsonAsync($"/SeasonPlan/mesocycles/{meso.Id}/generate-weeks",
                new { type = 0, namePrefix = "Týden", overwrite = false }))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);

        // With overwrite → regenerated with the new type
        var overwrite = await client.PostAsJsonAsync($"/SeasonPlan/mesocycles/{meso.Id}/generate-weeks",
            new { type = 4, namePrefix = "Week", overwrite = true });
        overwrite.StatusCode.Should().Be(HttpStatusCode.OK);
        var regenerated = (await overwrite.Content.ReadFromJsonAsync<MesocycleDto>())!;
        regenerated.Microcycles.Should().HaveCount(3)
            .And.OnlyContain(mc => mc.Type == CoreBusiness.Enums.MicrocycleType.Competition);

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }

    [Fact]
    public async Task Extending_mesocycle_with_shiftFollowing_ripples_later_cycles()
    {
        var client = await CreateClientAsync(_coachEmail);

        var first = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Ripple A", new DateTime(2038, 7, 1), new DateTime(2038, 7, 28)));
        var second = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Ripple B", new DateTime(2038, 8, 1), new DateTime(2038, 8, 31)));
        // Microcycle inside the second mesocycle must shift together with it
        var microResponse = await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = second.Id,
            Name = "Týden B1",
            StartDate = new DateTime(2038, 8, 3),
            EndDate = new DateTime(2038, 8, 9),
        });
        microResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Extend the first mesocycle by 14 days into the second one, with ripple
        first.EndDate = new DateTime(2038, 8, 11);
        var update = await client.PutAsJsonAsync(
            $"/SeasonPlan/mesocycles/{first.Id}?shiftFollowing=true", first);
        update.StatusCode.Should().Be(HttpStatusCode.OK);

        var plan = await client.GetFromJsonAsync<SeasonPlanDto>($"/SeasonPlan/team/{_teamId}");
        var shifted = plan!.Mesocycles.Single(m => m.Id == second.Id);
        shifted.StartDate.Should().Be(new DateTime(2038, 8, 15));
        shifted.EndDate.Should().Be(new DateTime(2038, 9, 14));
        shifted.Microcycles.Single().StartDate.Should().Be(new DateTime(2038, 8, 17));
        shifted.Microcycles.Single().EndDate.Should().Be(new DateTime(2038, 8, 23));

        // Without shiftFollowing the same extension overlaps → 400
        first.EndDate = new DateTime(2038, 8, 20);
        (await client.PutAsJsonAsync($"/SeasonPlan/mesocycles/{first.Id}", first))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{first.Id}");
        await client.DeleteAsync($"/SeasonPlan/mesocycles/{second.Id}");
    }

    [Fact]
    public async Task Microcycle_ripple_shifts_siblings_and_rejects_overflow()
    {
        var client = await CreateClientAsync(_coachEmail);

        // Mon 4.7.2039 – Sun 24.7.2039 → 3 exact weeks
        var meso = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Ripple mikro", new DateTime(2039, 7, 4), new DateTime(2039, 7, 24)));
        var generate = await client.PostAsJsonAsync($"/SeasonPlan/mesocycles/{meso.Id}/generate-weeks",
            new { type = 0, namePrefix = "T", overwrite = false });
        var withWeeks = (await generate.Content.ReadFromJsonAsync<MesocycleDto>())!;
        withWeeks.Microcycles.Should().HaveCount(3); // 4.-10., 11.-17., 18.-24.

        // Shrink the first week by 2 days with ripple → siblings move 2 days earlier
        var firstWeek = withWeeks.Microcycles[0];
        firstWeek.EndDate = new DateTime(2039, 7, 8);
        (await client.PutAsJsonAsync($"/SeasonPlan/microcycles/{firstWeek.Id}?shiftFollowing=true", firstWeek))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var plan = await client.GetFromJsonAsync<SeasonPlanDto>($"/SeasonPlan/team/{_teamId}");
        var weeks = plan!.Mesocycles.Single(m => m.Id == meso.Id).Microcycles;
        weeks[1].StartDate.Should().Be(new DateTime(2039, 7, 9));
        weeks[2].EndDate.Should().Be(new DateTime(2039, 7, 22));

        // Extending the first week would push the last sibling past the mesocycle end → 400
        firstWeek.EndDate = new DateTime(2039, 7, 12);
        (await client.PutAsJsonAsync($"/SeasonPlan/microcycles/{firstWeek.Id}?shiftFollowing=true", firstWeek))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }

    // ── Recommended trainings ────────────────────────────────────────────────

    [Fact]
    public async Task Recommended_trainings_replace_set_works()
    {
        var client = await CreateClientAsync(_coachEmail);

        int trainingId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            var training = new Training { Name = $"PlanTraining-{Guid.NewGuid():N}", Duration = 60 };
            db.Trainings.Add(training);
            await db.SaveChangesAsync();
            trainingId = training.Id;
        }

        var meso = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Blok H", new DateTime(2032, 1, 1), new DateTime(2032, 1, 31)));
        var microResponse = await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = meso.Id,
            Name = "Týden s tréninky",
            StartDate = new DateTime(2032, 1, 5),
            EndDate = new DateTime(2032, 1, 11)
        });
        var micro = (await microResponse.Content.ReadFromJsonAsync<MicrocycleDto>())!;

        var setResponse = await client.PutAsJsonAsync($"/SeasonPlan/microcycles/{micro.Id}/trainings",
            new MicrocycleTrainingsUpdateDto
            {
                Items = [new MicrocycleTrainingItemDto { TrainingId = trainingId, Note = "Zaměřit na střelbu", SortOrder = 1 }]
            });
        setResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var withTrainings = (await setResponse.Content.ReadFromJsonAsync<MicrocycleDto>())!;
        withTrainings.RecommendedTrainings.Should().ContainSingle(rt => rt.TrainingId == trainingId)
            .Which.Note.Should().Be("Zaměřit na střelbu");
        withTrainings.RecommendedTrainings.Single().ScheduledCount.Should().Be(0);

        // Scheduling the training inside the microcycle range bumps ScheduledCount
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            var placeId = await db.Places.Select(p => p.Id).FirstAsync();
            db.Appointments.Add(new Appointment
            {
                Name = "Naplánovaný trénink",
                Start = new DateTime(2032, 1, 7, 18, 0, 0),
                End = new DateTime(2032, 1, 7, 19, 0, 0),
                LocationId = placeId,
                TeamId = _teamId,
                TrainingId = trainingId
            });
            await db.SaveChangesAsync();
        }

        var planAfter = await client.GetFromJsonAsync<SeasonPlanDto>($"/SeasonPlan/team/{_teamId}");
        planAfter!.Mesocycles.Single(m => m.Id == meso.Id)
            .Microcycles.Single(mc => mc.Id == micro.Id)
            .RecommendedTrainings.Single().ScheduledCount.Should().Be(1);

        // Replace with empty set
        var clearResponse = await client.PutAsJsonAsync($"/SeasonPlan/microcycles/{micro.Id}/trainings",
            new MicrocycleTrainingsUpdateDto());
        (await clearResponse.Content.ReadFromJsonAsync<MicrocycleDto>())!
            .RecommendedTrainings.Should().BeEmpty();

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }

    // ── Evaluation ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Evaluation_aggregates_coverage_attendance_ratings_and_test_progression()
    {
        var client = await CreateClientAsync(_coachEmail);

        // Past dates so the training event counts as held (End <= now)
        var meso = NewMesocycle(_teamId, "Vyhodnocovaný blok", new DateTime(2020, 7, 6), new DateTime(2020, 8, 2));
        meso.GoalTagIds = [_goalTagId1];
        var created = await CreateMesocycleAsync(client, meso);

        (await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = created.Id,
            Name = "Týden 1",
            StartDate = new DateTime(2020, 7, 6),
            EndDate = new DateTime(2020, 7, 12)
        })).StatusCode.Should().Be(HttpStatusCode.OK);

        int memberId1, memberId2;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();

            var members = await db.TeamMembers
                .Where(tm => tm.TeamId == _teamId)
                .Select(tm => tm.MemberId)
                .ToListAsync();
            members.Should().HaveCountGreaterOrEqualTo(2);
            memberId1 = members[0];
            memberId2 = members[1];

            // Training: 30 min part hitting the goal tag + 30 min part with an unrelated tag
            var matchingActivity = new Activity
            {
                Name = $"EvalActivity-{Guid.NewGuid():N}",
                ActivityTags = [new ActivityTag { TagId = _goalTagId1 }]
            };
            var otherActivity = new Activity
            {
                Name = $"EvalOther-{Guid.NewGuid():N}",
                ActivityTags = [new ActivityTag { TagId = _goalTagId2 }]
            };
            var training = new Training
            {
                Name = $"EvalTraining-{Guid.NewGuid():N}",
                Duration = 60,
                TrainingParts =
                [
                    new TrainingPart
                    {
                        Name = "Cíl",
                        Duration = 30,
                        TrainingGroups = [new TrainingGroup { Activity = matchingActivity }]
                    },
                    new TrainingPart
                    {
                        Name = "Ostatní",
                        Duration = 30,
                        TrainingGroups = [new TrainingGroup { Activity = otherActivity }]
                    }
                ]
            };
            db.Trainings.Add(training);
            await db.SaveChangesAsync();

            var placeId = await db.Places.Select(p => p.Id).FirstAsync();
            var trainingEvent = new Appointment
            {
                Name = "Odehraný trénink",
                AppointmentType = CoreBusiness.Enums.AppointmentType.Training,
                Start = new DateTime(2020, 7, 7, 18, 0, 0),
                End = new DateTime(2020, 7, 7, 19, 0, 0),
                LocationId = placeId,
                TeamId = _teamId,
                TrainingId = training.Id
            };
            db.Appointments.Add(trainingEvent);
            await db.SaveChangesAsync();

            var absentee = new Member
            {
                FirstName = "Eval",
                LastName = "Absentee",
                BirthYear = 2006,
                ClubId = _clubId
            };
            db.Members.Add(absentee);
            await db.SaveChangesAsync();

            db.AppointmentAttendances.AddRange(
                new AppointmentAttendance { AppointmentId = trainingEvent.Id, MemberId = memberId1, Status = 1 },
                new AppointmentAttendance { AppointmentId = trainingEvent.Id, MemberId = memberId2, Status = 1 },
                new AppointmentAttendance { AppointmentId = trainingEvent.Id, MemberId = absentee.Id, Status = 2 });
            db.AppointmentRatings.AddRange(
                new AppointmentRating { AppointmentId = trainingEvent.Id, UserId = "u1", Grade = 2, RaterType = CoreBusiness.Enums.RaterType.Coach },
                new AppointmentRating { AppointmentId = trainingEvent.Id, UserId = "u2", Grade = 1, RaterType = CoreBusiness.Enums.RaterType.Player });

            // Milestone testing: sprint (lower is better), measured at both mesocycle boundaries
            var sprint = new TestDefinition
            {
                Name = $"EvalSprint-{Guid.NewGuid():N}",
                Unit = "s",
                HigherIsBetter = false,
                ClubId = _clubId
            };
            db.TestDefinitions.Add(sprint);
            await db.SaveChangesAsync();

            var startTesting = new Appointment
            {
                Name = "Vstupní testování",
                AppointmentType = CoreBusiness.Enums.AppointmentType.Testing,
                Start = new DateTime(2020, 7, 6, 17, 0, 0),
                End = new DateTime(2020, 7, 6, 18, 0, 0),
                LocationId = placeId,
                TeamId = _teamId,
                AppointmentTestDefinitions = [new AppointmentTestDefinition { TestDefinitionId = sprint.Id }]
            };
            var endTesting = new Appointment
            {
                Name = "Výstupní testování",
                AppointmentType = CoreBusiness.Enums.AppointmentType.Testing,
                Start = new DateTime(2020, 8, 1, 17, 0, 0),
                End = new DateTime(2020, 8, 1, 18, 0, 0),
                LocationId = placeId,
                TeamId = _teamId,
                AppointmentTestDefinitions = [new AppointmentTestDefinition { TestDefinitionId = sprint.Id }]
            };
            db.Appointments.AddRange(startTesting, endTesting);

            db.TestResults.AddRange(
                // member1 improves (5.0 → 4.6 s, lower is better), member2 worsens (5.2 → 5.4)
                new TestResult { TestDefinitionId = sprint.Id, MemberId = memberId1, NumericValue = 5.0, TestDate = new DateTime(2020, 7, 6), RecordedByUserId = "t" },
                new TestResult { TestDefinitionId = sprint.Id, MemberId = memberId2, NumericValue = 5.2, TestDate = new DateTime(2020, 7, 6), RecordedByUserId = "t" },
                new TestResult { TestDefinitionId = sprint.Id, MemberId = memberId1, NumericValue = 4.6, TestDate = new DateTime(2020, 8, 1), RecordedByUserId = "t" },
                new TestResult { TestDefinitionId = sprint.Id, MemberId = memberId2, NumericValue = 5.4, TestDate = new DateTime(2020, 8, 1), RecordedByUserId = "t" });
            await db.SaveChangesAsync();
        }

        var response = await client.GetAsync($"/SeasonPlan/mesocycles/{created.Id}/evaluation");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var evaluation = (await response.Content.ReadFromJsonAsync<MesocycleEvaluationDto>())!;

        // Goal coverage: 30 of 60 activity minutes hit the goal tag
        evaluation.Total.TrainingAppointmentsCount.Should().Be(1);
        evaluation.Total.WithLinkedTrainingCount.Should().Be(1);
        evaluation.Total.TotalTrainingMinutes.Should().Be(60);
        evaluation.Total.GoalMatchedMinutes.Should().Be(30);
        evaluation.Total.GoalCoveragePercent.Should().Be(50);
        evaluation.Total.PerTag.Should().ContainSingle(pt => pt.TagId == _goalTagId1)
            .Which.MatchedMinutes.Should().Be(30);

        // Attendance: 2 present, 1 absent → 66.7 %
        evaluation.Total.PresentCount.Should().Be(2);
        evaluation.Total.AbsentCount.Should().Be(1);
        evaluation.Total.AttendanceRatePercent.Should().BeApproximately(66.7, 0.1);

        // Ratings
        evaluation.Total.AverageGrade.Should().Be(1.5);
        evaluation.Total.CoachAverageGrade.Should().Be(2);
        evaluation.Total.PlayerAverageGrade.Should().Be(1);

        // Microcycle block (falls back to mesocycle goals) sees the same event
        var week = evaluation.Microcycles.Should().ContainSingle().Subject;
        week.GoalMatchedMinutes.Should().Be(30);
        week.PresentCount.Should().Be(2);

        // Test progression: one improved, one worsened, delta −0.1 s on average
        evaluation.TestingAppointments.Should().HaveCount(2);
        var progression = evaluation.TestProgression.Should().ContainSingle().Subject;
        progression.MembersMeasuredBoth.Should().Be(2);
        progression.ImprovedCount.Should().Be(1);
        progression.WorsenedCount.Should().Be(1);
        progression.StartAvg.Should().Be(5.1);
        progression.EndAvg.Should().Be(5.0);
        progression.Delta.Should().BeApproximately(-0.1, 0.001);

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{created.Id}");
    }

    [Fact]
    public async Task Moving_mesocycle_with_shiftChildren_moves_its_microcycles()
    {
        var client = await CreateClientAsync(_coachEmail);

        var meso = await CreateMesocycleAsync(client,
            NewMesocycle(_teamId, "Drag blok", new DateTime(2044, 7, 6), new DateTime(2044, 7, 19)));
        (await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = meso.Id,
            Name = "Týden 1",
            StartDate = new DateTime(2044, 7, 6),
            EndDate = new DateTime(2044, 7, 12)
        })).StatusCode.Should().Be(HttpStatusCode.OK);

        // Pure move by +7 days without shiftChildren → children would fall outside → 400
        meso.StartDate = new DateTime(2044, 7, 13);
        meso.EndDate = new DateTime(2044, 7, 26);
        (await client.PutAsJsonAsync($"/SeasonPlan/mesocycles/{meso.Id}", meso))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Same move with shiftChildren → microcycle moves along
        var moved = await client.PutAsJsonAsync(
            $"/SeasonPlan/mesocycles/{meso.Id}?shiftChildren=true", meso);
        moved.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = (await moved.Content.ReadFromJsonAsync<MesocycleDto>())!;
        var micro = dto.Microcycles.Should().ContainSingle().Subject;
        micro.StartDate.Should().Be(new DateTime(2044, 7, 13));
        micro.EndDate.Should().Be(new DateTime(2044, 7, 19));

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }

    // ── Copy plan with team into a new season ────────────────────────────────

    [Fact]
    public async Task Copy_to_season_with_plan_shifts_cycles_by_season_start_delta()
    {
        var client = await CreateClientAsync(_coachEmail);

        int sourceSeasonId, targetSeasonId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            var sourceSeason = new Season
            {
                Name = $"CopySrc-{Guid.NewGuid():N}",
                StartDate = new DateTime(2041, 8, 1),
                EndDate = new DateTime(2042, 6, 30),
                ClubId = _clubId
            };
            var targetSeason = new Season
            {
                Name = $"CopyDst-{Guid.NewGuid():N}",
                StartDate = new DateTime(2042, 8, 1), // exactly 365 days later
                EndDate = new DateTime(2043, 6, 30),
                ClubId = _clubId
            };
            db.Seasons.AddRange(sourceSeason, targetSeason);
            await db.SaveChangesAsync();
            sourceSeasonId = sourceSeason.Id;
            targetSeasonId = targetSeason.Id;

            var team = await db.Teams.FirstAsync(t => t.Id == _teamId);
            team.SeasonId = sourceSeasonId;
            await db.SaveChangesAsync();
        }

        var meso = NewMesocycle(_teamId, "Přípravný blok", new DateTime(2041, 8, 4), new DateTime(2041, 8, 31));
        meso.GoalTagIds = [_goalTagId1];
        var created = await CreateMesocycleAsync(client, meso);
        (await client.PostAsJsonAsync("/SeasonPlan/microcycles", new MicrocycleDto
        {
            MesocycleId = created.Id,
            Name = "Týden 1",
            Type = CoreBusiness.Enums.MicrocycleType.Development,
            StartDate = new DateTime(2041, 8, 4),
            EndDate = new DateTime(2041, 8, 10)
        })).StatusCode.Should().Be(HttpStatusCode.OK);

        // Coach cannot copy teams; use admin (HeadCoach+ endpoint)
        var adminClient = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(adminClient);
        adminClient.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);

        var copyResponse = await adminClient.PostAsJsonAsync($"/Teams/{_teamId}/copy-to-season",
            new { seasonId = targetSeasonId, newName = $"CopyTeam-{Guid.NewGuid():N}", copyMembers = false, copyPlan = true });
        copyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var newTeamId = (await copyResponse.Content.ReadFromJsonAsync<CopyResult>())!.NewTeamId;

        var plan = await adminClient.GetFromJsonAsync<SeasonPlanDto>($"/SeasonPlan/team/{newTeamId}");
        var copiedMeso = plan!.Mesocycles.Should().ContainSingle().Subject;
        copiedMeso.Name.Should().Be("Přípravný blok");
        copiedMeso.StartDate.Should().Be(new DateTime(2042, 8, 4)); // +365 days
        copiedMeso.EndDate.Should().Be(new DateTime(2042, 8, 31));
        copiedMeso.GoalTagIds.Should().BeEquivalentTo([_goalTagId1]);
        var copiedMicro = copiedMeso.Microcycles.Should().ContainSingle().Subject;
        copiedMicro.StartDate.Should().Be(new DateTime(2042, 8, 4));
        copiedMicro.Type.Should().Be(CoreBusiness.Enums.MicrocycleType.Development);

        // Cleanup the copied team + seasons (source team/meso cleaned by DisposeAsync)
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            db.Mesocycles.RemoveRange(db.Mesocycles.Where(m => m.TeamId == newTeamId));
            await db.SaveChangesAsync();
            db.Teams.RemoveRange(db.Teams.Where(t => t.Id == newTeamId));
            var team = await db.Teams.FirstAsync(t => t.Id == _teamId);
            team.SeasonId = null;
            await db.SaveChangesAsync();
            db.Seasons.RemoveRange(db.Seasons.Where(s => s.Id == sourceSeasonId || s.Id == targetSeasonId));
            await db.SaveChangesAsync();
        }

        await client.DeleteAsync($"/SeasonPlan/mesocycles/{created.Id}");
    }

    private sealed class CopyResult
    {
        public int NewTeamId { get; set; }
    }

    // ── Authorization ────────────────────────────────────────────────────────

    [Fact]
    public async Task Plan_requires_authentication()
    {
        var client = _factory.CreateClient();
        (await client.GetAsync($"/SeasonPlan/team/{_teamId}"))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Coach_of_other_club_cannot_read_or_write_plan()
    {
        var client = await CreateClientAsync(_otherCoachEmail);

        (await client.GetAsync($"/SeasonPlan/team/{_teamId}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        (await client.PostAsJsonAsync("/SeasonPlan/mesocycles",
                NewMesocycle(_teamId, "Cizí blok", new DateTime(2033, 1, 1), new DateTime(2033, 1, 31))))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Player_can_read_but_not_write_plan()
    {
        var coachClient = await CreateClientAsync(_coachEmail);
        var meso = await CreateMesocycleAsync(coachClient,
            NewMesocycle(_teamId, "Blok pro hráče", new DateTime(2034, 1, 1), new DateTime(2034, 1, 31)));

        var playerClient = await CreateClientAsync(_playerEmail);

        var read = await playerClient.GetAsync($"/SeasonPlan/team/{_teamId}");
        read.StatusCode.Should().Be(HttpStatusCode.OK);
        (await read.Content.ReadFromJsonAsync<SeasonPlanDto>())!
            .Mesocycles.Should().Contain(m => m.Id == meso.Id);

        (await playerClient.PostAsJsonAsync("/SeasonPlan/mesocycles",
                NewMesocycle(_teamId, "Hráčův blok", new DateTime(2035, 1, 1), new DateTime(2035, 1, 31))))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        (await playerClient.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        await coachClient.DeleteAsync($"/SeasonPlan/mesocycles/{meso.Id}");
    }
}
