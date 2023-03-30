using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class TrainingPartFactory : ITrainingPartFactory
{
    private readonly ITrainingGroupFactory _trainingGroupFactory;

    public TrainingPartFactory(ITrainingGroupFactory trainingGroupFactory)
    {
        _trainingGroupFactory = trainingGroupFactory;
    }

    public TrainingPart Build(Training training, TrainingPartDto dto)
    {
        var trainingPart = new TrainingPart(training);
        trainingPart.Initialize(dto.TrainingPartId, dto.Name, dto.Description, dto.Duration, dto.Order);

        foreach (var trainingGroupDto in dto.TrainingGroups)
        {
            trainingPart.AddTrainingGroup(_trainingGroupFactory.Build(trainingPart, trainingGroupDto));
        }

        return trainingPart;
    }

    public TrainingPart Build(TrainingPartDto dto)
    {
        throw new NotImplementedException();
    }
}

