using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class TrainingFactory : ITrainingFactory
{
    private readonly ITrainingPartFactory _trainingPartFactory;

    public TrainingFactory(ITrainingPartFactory trainingPartFactory)
    {
        _trainingPartFactory = trainingPartFactory;
    }

    public Training GetMergedOrBuild(TrainingDto dto)
    {
        throw new NotImplementedException();
    }

    public Training Build(TrainingDto dto)
    {
        var training = new Training();
        training.Initialize(dto.TrainingId, dto.Name, dto.Description, dto.Duration, dto.Persons);

        foreach (var trainingPartDto in dto.TrainingParts)
        {
            training.AddTrainingPart(_trainingPartFactory.Build(training, trainingPartDto));
        }

        return training;
    }
}