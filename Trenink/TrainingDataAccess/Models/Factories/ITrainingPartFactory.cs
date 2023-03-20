using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public interface ITrainingPartFactory : IFactory<TrainingPart, TrainingPartDto>
{
    TrainingPart Build(Training training, TrainingPartDto trainingPartDto);
}