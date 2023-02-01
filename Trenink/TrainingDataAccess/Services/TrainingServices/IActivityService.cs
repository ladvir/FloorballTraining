using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.TrainingServices
{
    public interface ITrainingService
    {
        Task DeleteTraining(Training training);

        Task<Training> CreateTraining(Training training);

        Task<List<Training>> GetAllTrainings();

        Task<Training> GetTraining(int id);

        Task UpdateTraining(Training training);
    }
}