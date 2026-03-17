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
        Task UpdateIsDraftAsync(int id, bool isDraft);
        Task<(int Total, int DraftCount, int CompleteCount)> GetTrainingCountsAsync();
        Task<int> GetMinPartsDurationPercentAsync(int trainingId, int defaultValue = 95);
    }
}
