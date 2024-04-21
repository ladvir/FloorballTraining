using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface ITrainingRepository : IGenericRepository<Training>
    {
        Task UpdateTrainingAsync(Training existingActivity);
        Task AddTrainingAsync(Training training);
        Task<List<string?>> GetEquipmentByTrainingIdAsync(int trainingId);

        Task DeleteAsync(int id);
        Task<Training> CloneTrainingAsync(int trainingId);
    }
}
