using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface ITrainingRepository
    {
        Task<IEnumerable<Training>> GetTrainingsByNameAsync(string searchString = "");

        Task UpdateTrainingAsync(Training existingActivity);
        Task<Training?> GetTrainingByIdAsync(int activityId);
        Task AddTrainingAsync(Training training);
        Task<List<string?>> GetEquipmentByTrainingIdAsync(int trainingId);
        Task<IEnumerable<Training>> GetTrainingsByCriteriaAsync(SearchCriteria? criteria);
    }
}
