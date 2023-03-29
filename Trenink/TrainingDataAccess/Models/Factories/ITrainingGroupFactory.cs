using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public interface ITrainingGroupFactory : IFactory<TrainingGroup, TrainingGroupDto>
{
    TrainingGroup Build(TrainingPart trainingPart, TrainingGroupDto trainingGroupDto);
}