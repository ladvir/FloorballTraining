using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Models.Factories;

public interface ITrainingGroupActivityFactory : IFactory<TrainingGroupActivity, TrainingGroupActivityDto>
{
    TrainingGroupActivity Build(TrainingGroup trainingGroup, TrainingGroupActivityDto trainingGroupActivityDto);
}