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

/*
 * var training = new Training();
        training.Initialize(dto.TrainingId, dto.Name, dto.Description, dto.Duration, dto.Persons);

        foreach (var trainingPartDto in dto.TrainingParts)
        {
            training.AddTrainingPart(_trainingPartFactory.Build(training, trainingPartDto));
        }

        return training;
 *
 */