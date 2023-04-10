namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface ITrainingRepository
    {
        Task<IEnumerable<CoreBusiness.Training>> GetTrainingsByNameAsync(string searchString = "");

        Task UpdateTrainingAsync(CoreBusiness.Training existingActivity);
        Task<CoreBusiness.Training> GetTrainingByIdAsync(int activityId);
        Task AddTrainingAsync(CoreBusiness.Training training);
    }
}
