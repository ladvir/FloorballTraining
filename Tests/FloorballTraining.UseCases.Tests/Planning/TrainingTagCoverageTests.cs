using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tests.Planning;

public class TrainingTagCoverageTests
{
    private static Activity ActivityWithTags(params int[] tagIds) => new()
    {
        ActivityTags = tagIds.Select(id => new ActivityTag { TagId = id }).ToList()
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
        training.GetActivitiesDurationForTags([1, 2]).Should().Be(0);
    }

    [Fact]
    public void Empty_tag_set_returns_zero()
    {
        var training = new Training { TrainingParts = [Part(20, ActivityWithTags(1))] };
        training.GetActivitiesDurationForTags([]).Should().Be(0);
    }

    [Fact]
    public void No_matching_tags_returns_zero()
    {
        var training = new Training
        {
            TrainingParts = [Part(20, ActivityWithTags(5)), Part(15, ActivityWithTags(6))]
        };
        training.GetActivitiesDurationForTags([1, 2]).Should().Be(0);
    }

    [Fact]
    public void Sums_only_parts_with_a_matching_activity()
    {
        var training = new Training
        {
            TrainingParts =
            [
                Part(20, ActivityWithTags(1)),       // matches
                Part(15, ActivityWithTags(9)),       // no match
                Part(10, ActivityWithTags(8), ActivityWithTags(2)) // second activity matches
            ]
        };
        training.GetActivitiesDurationForTags([1, 2]).Should().Be(30);
    }

    [Fact]
    public void Part_with_multiple_matching_activities_counts_once()
    {
        var training = new Training
        {
            TrainingParts = [Part(25, ActivityWithTags(1), ActivityWithTags(1, 2))]
        };
        training.GetActivitiesDurationForTags([1, 2]).Should().Be(25);
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
        training.GetActivitiesDurationForTags([1]).Should().Be(0);
    }
}
