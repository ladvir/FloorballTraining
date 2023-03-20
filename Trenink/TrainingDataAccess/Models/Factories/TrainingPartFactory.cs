using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public class TrainingPartFactory : ITrainingPartFactory
{
    public TrainingPart Build(Training training, TrainingPartDto dto)
    {
        var trainingPart = new TrainingPart(training);
        trainingPart.Initialize(dto.TrainingPartId, dto.Name, dto.Description, dto.Duration, dto.Order);

        return trainingPart;
    }

    public TrainingPart Build(TrainingPartDto dto)
    {
        throw new NotImplementedException();
    }
}