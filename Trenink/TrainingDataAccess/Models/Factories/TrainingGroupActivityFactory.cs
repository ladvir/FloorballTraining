using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class TrainingGroupActivityFactory : ITrainingGroupActivityFactory
{
    private readonly IActivityFactory _activityFactory;

    public TrainingGroupActivityFactory(IActivityFactory activityFactory)
    {
        _activityFactory = activityFactory;
    }


    public TrainingGroupActivity Build(TrainingGroupActivityDto dto)
    {
        throw new NotImplementedException();
    }

    public TrainingGroupActivity Build(TrainingGroup trainingGroup, TrainingGroupActivityDto trainingGroupActivityDto)
    {
        var trainingGroupActivity = new TrainingGroupActivity();
        trainingGroupActivity.Initialize(trainingGroup, _activityFactory.Build(trainingGroup, trainingGroupActivityDto.Activity));
        return trainingGroupActivity;
    }
}