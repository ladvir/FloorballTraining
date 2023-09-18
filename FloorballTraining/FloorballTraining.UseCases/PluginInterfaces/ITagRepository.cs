using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface ITagRepository
    {
        Task AddTagAsync(Tag tag);
        Task<IEnumerable<Tag>> GetTagsByNameAsync(string searchString = "", bool isTrainingGoal = false);
        Task<IEnumerable<Tag>> GetTagsByParentTagIdAsync(int? parentTagId);
        Task UpdateTagAsync(Tag tag);

        Task DeleteTagAsync(Tag tag);
        Task<Tag> GetTagByIdAsync(int tagId);
    }
}
