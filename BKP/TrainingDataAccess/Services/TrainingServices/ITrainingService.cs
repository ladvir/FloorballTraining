using System.Collections.Generic;
using System.Threading.Tasks;

namespace TrainingDataAccess.Services.TrainingServices
{
    public interface ITrainingService
    {
        Task DeleteTraining(Training training);

        Task<Training> CreateTraining(Training training);

        Task<IEnumerable<Training>> GetAllTrainings();

        Task<Training> GetTraining(int id);

        Task UpdateTraining(Training training);
    }
}