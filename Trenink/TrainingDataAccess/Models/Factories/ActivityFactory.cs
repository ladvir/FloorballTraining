using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class ActivityFactory : IActivityFactory
{
    public Activity GetMergedOrBuild(ActivityDto dto)
    {
        throw new NotImplementedException();
    }

    public Activity Build(ActivityDto dto)
    {
        var activity = new Activity();
        activity.Initialize(dto.ActivityId, dto.Name, dto.Description, dto.PersonsMin, dto.PersonsMax, dto.DurationMin, dto.DurationMax);
        return activity;
    }
}