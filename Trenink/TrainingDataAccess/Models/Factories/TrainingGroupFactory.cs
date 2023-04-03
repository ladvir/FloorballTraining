using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class TrainingGroupFactory : ITrainingGroupFactory
{
    private readonly ITrainingGroupActivityFactory _activityGroupActivityFactory;

    public TrainingGroupFactory(ITrainingGroupActivityFactory activityGroupActivityFactory)
    {
        _activityGroupActivityFactory = activityGroupActivityFactory;
    }

    public TrainingGroup Build(TrainingGroupDto dto)
    {
        throw new NotImplementedException();
    }

    public TrainingGroup Build(TrainingPart trainingPart, TrainingGroupDto dto)
    {
        var trainingGroup = new TrainingGroup();
        trainingGroup.Initialize(trainingPart, dto.TrainingGroupId, dto.Name);

        foreach (var trainingGroupActivity in dto.TrainingGroupActivities)
        {
            trainingGroup.AddTrainingGroupActivity(_activityGroupActivityFactory.Build(trainingGroup, trainingGroupActivity));
        }

        return trainingGroup;
    }
}