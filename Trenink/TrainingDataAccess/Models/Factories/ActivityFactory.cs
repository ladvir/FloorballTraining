using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class ActivityFactory : IActivityFactory
{
    private readonly IActivityTagFactory _activityTagFactory;

    public ActivityFactory(IActivityTagFactory activityTagFactory)
    {
        _activityTagFactory = activityTagFactory;
    }


    public Activity GetMergedOrBuild(ActivityDto dto)
    {
        throw new NotImplementedException();
    }

    public Activity Build(ActivityDto dto)
    {
        var activity = new Activity();
        activity.Initialize(dto.ActivityId, dto.Name, dto.Description, dto.PersonsMin, dto.PersonsMax, dto.DurationMin, dto.DurationMax);

        foreach (var activityTag in dto.AcitvityTags)
        {
            activity.AddActivityTag(_activityTagFactory.Build(activityTag));

        }
        return activity;
    }

}