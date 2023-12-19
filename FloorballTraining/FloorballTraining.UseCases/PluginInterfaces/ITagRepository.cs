using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface ITagRepository : IGenericRepository<Tag>
    {
        Task AddTagAsync(Tag tag);
        Task<IReadOnlyList<Tag>> GetTagsByNameAsync(string searchString = "", bool isTrainingGoal = false);
        Task<IEnumerable<Tag>> GetTagsByParentTagIdAsync(int? parentTagId);
        Task UpdateTagAsync(Tag tag);

        Task DeleteTagAsync(Tag tag);

    }
}
