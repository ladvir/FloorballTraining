using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tests.Planning;

public class TrainingSkillCoverageTests
{
    private static Activity ActivityWithSkills(params int[] skillIds) => new()
    {
        ActivitySkills = skillIds.Select(id => new ActivitySkill { SkillId = id }).ToList()
    };

    private static TrainingPart Part(int duration, params Activity[] activities) => new()
    {
        Duration = duration,
        TrainingGroups = activities.Select(a => new TrainingGroup { Activity = a }).ToList()
    };

    [Fact]
    public void No_parts_returns_zero()
    {
        var training = new Training { TrainingParts = [] };
        training.GetActivitiesDurationForSkills([1, 2]).Should().Be(0);
    }

    [Fact]
    public void Empty_skill_set_returns_zero()
    {
        var training = new Training { TrainingParts = [Part(20, ActivityWithSkills(1))] };
        training.GetActivitiesDurationForSkills([]).Should().Be(0);
    }

    [Fact]
    public void No_matching_skills_returns_zero()
    {
        var training = new Training
        {
            TrainingParts = [Part(20, ActivityWithSkills(5)), Part(15, ActivityWithSkills(6))]
        };
        training.GetActivitiesDurationForSkills([1, 2]).Should().Be(0);
    }

    [Fact]
    public void Sums_only_parts_with_a_matching_activity()
    {
        var training = new Training
        {
            TrainingParts =
            [
                Part(20, ActivityWithSkills(1)),       // matches
                Part(15, ActivityWithSkills(9)),       // no match
                Part(10, ActivityWithSkills(8), ActivityWithSkills(2)) // second activity matches
            ]
        };
        training.GetActivitiesDurationForSkills([1, 2]).Should().Be(30);
    }

    [Fact]
    public void Part_with_multiple_matching_activities_counts_once()
    {
        var training = new Training
        {
            TrainingParts = [Part(25, ActivityWithSkills(1), ActivityWithSkills(1, 2))]
        };
        training.GetActivitiesDurationForSkills([1, 2]).Should().Be(25);
    }

    [Fact]
    public void Groups_without_activity_are_ignored()
    {
        var part = new TrainingPart
        {
            Duration = 30,
            TrainingGroups = [new TrainingGroup { Activity = null }]
        };
        var training = new Training { TrainingParts = [part] };
        training.GetActivitiesDurationForSkills([1]).Should().Be(0);
    }
}
