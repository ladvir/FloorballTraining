using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public interface IActivityFactory : IFactory<Activity, ActivityDto>
{
    Activity Build(TrainingGroup trainingGroup, ActivityDto activityDto);

}