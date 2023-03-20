using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Services.TrainingServices
{
    public interface ITrainingService
    {
        Task DeleteTraining(TrainingDto training);

        Task<TrainingDto> GetTraining(int id);

        Task<DataResult<TrainingDto>> GetTrainings(PaginationDTO pagination, string searchString);

        Task SaveTraining(TrainingDto training);
    }
}