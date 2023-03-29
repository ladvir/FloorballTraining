using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class TrainingGroupFactory : ITrainingGroupFactory
{
    private readonly IActivityFactory _activityFactory;

    public TrainingGroupFactory(IActivityFactory activityFactory)
    {
        _activityFactory = activityFactory;
    }

    public TrainingGroup Build(TrainingGroupDto dto)
    {
        throw new NotImplementedException();
    }

    public TrainingGroup Build(TrainingPart trainingPart, TrainingGroupDto dto)
    {
        var trainingGroup = new TrainingGroup(trainingPart);
        trainingGroup.Initialize(dto.TrainingPartId, dto.Name);

        foreach (var activityDto in dto.Activities)
        {
            trainingGroup.AddActivity(_activityFactory.Build(trainingGroup, activityDto));
        }

        return trainingGroup;
    }
}