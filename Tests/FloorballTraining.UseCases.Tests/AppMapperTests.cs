using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Tests;

/// <summary>Covers the non-trivial rules carried over from the former AutoMapper profile.</summary>
public class AppMapperTests
{
    private readonly AppMapper _mapper = new();

    [Fact]
    public void Tag_WithoutParent_HasEmptyParentName_AndWithParent_HasItsName()
    {
        _mapper.ToTagDto(new Tag { Name = "A" })!.ParentTagName.Should().Be("");
        _mapper.ToTagDto(new Tag { Name = "B", ParentTag = new Tag { Name = "Parent" } })!
            .ParentTagName.Should().Be("Parent");
    }

    [Fact]
    public void Place_Environment_IsMappedToString()
    {
        _mapper.ToPlaceDto(new Place { Name = "Hala", Environment = FloorballTraining.CoreBusiness.Enums.Environment.Indoor })!
            .Environment.Should().Be(FloorballTraining.CoreBusiness.Enums.Environment.Indoor.ToString());
    }

    [Fact]
    public void ActivitySkill_FlattensSkillAndCategory_AndToleratesMissingSkill()
    {
        var activity = new Activity
        {
            Name = "A",
            ActivitySkills =
            [
                new ActivitySkill
                {
                    SkillId = 7,
                    Skill = new Skill { Name = "Střelba", SkillCategoryId = 3, SkillCategory = new SkillCategory { Name = "Technika" } },
                },
                new ActivitySkill(),
            ],
        };

        var dto = _mapper.ToActivityDto(activity)!;

        dto.ActivitySkills.Should().HaveCount(2);
        dto.ActivitySkills[0].SkillName.Should().Be("Střelba");
        dto.ActivitySkills[0].SkillCategoryId.Should().Be(3);
        dto.ActivitySkills[0].SkillCategoryName.Should().Be("Technika");
        dto.ActivitySkills[1].SkillName.Should().BeNull();
        dto.ActivitySkills[1].SkillCategoryId.Should().BeNull();
    }

    [Fact]
    public void Training_UnwrapsAgeGroups_AndMapsGoalSkillCategoryName()
    {
        var training = new Training
        {
            Name = "T",
            TrainingAgeGroups = [new TrainingAgeGroup { AgeGroup = new AgeGroup { Name = "U13" } }],
            TrainingGoalSkill1 = new Skill { Name = "Přihrávka", SkillCategory = new SkillCategory { Name = "Technika" } },
        };

        var dto = _mapper.ToTrainingDto(training)!;

        dto.TrainingAgeGroups.Select(a => a.Name).Should().Equal("U13");
        dto.TrainingGoalSkill1!.SkillCategoryName.Should().Be("Technika");
    }

    [Fact]
    public void Appointment_MapsTargetsFromTrainingTags_AndFlattensNames()
    {
        var tag = new Tag { Name = "Střelba" };
        var appointment = new Appointment
        {
            Location = new Place { Name = "Hala" },
            Training = new Training { Name = "Trénink", TrainingTags = [new TrainingTag { Tag = tag }] },
        };

        var dto = _mapper.ToAppointmentDto(appointment)!;

        dto.TrainingTargets.Should().Be("Střelba");
        dto.LocationName.Should().Be("Hala");
        dto.TrainingName.Should().Be("Trénink");
        _mapper.ToAppointmentDto(new Appointment())!.TrainingTargets.Should().BeNull();
    }

    [Fact]
    public void Season_MapsClubName()
    {
        _mapper.ToSeasonDto(new Season { Club = new Club { Name = "Klub" } })!.ClubName.Should().Be("Klub");
        _mapper.ToSeasonDto(new Season())!.ClubName.Should().BeNull();
    }

    [Fact]
    public void CyclicGraph_TeamMemberClub_IsMappedWithoutOverflow_AndKeepsIdentity()
    {
        var club = new Club { Name = "Klub" };
        var team = new Team { Name = "Tým", Club = club };
        var member = new Member { FirstName = "A", Club = club };
        var tm = new TeamMember { Team = team, Member = member };
        club.Teams.Add(team);
        team.TeamMembers.Add(tm);

        var dto = _mapper.ToClubDto(club)!;

        dto.Teams.Should().HaveCount(1);
        dto.Teams[0].Club.Should().BeSameAs(dto);
        dto.Teams[0].TeamMembers[0].Member!.Club.Should().BeSameAs(dto);
    }

    [Fact]
    public void NullSource_ReturnsNull_AndListsMapToReadOnlyList()
    {
        _mapper.ToTeamDto(null).Should().BeNull();
        _mapper.ToTeamDtos([new Team { Name = "A" }, new Team { Name = "B" }]).Select(t => t.Name).Should().Equal("A", "B");
    }
}
