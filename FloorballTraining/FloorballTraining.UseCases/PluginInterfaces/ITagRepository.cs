using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface ITagRepository
    {
        Task AddTagAsync(Tag tag);
        Task<IEnumerable<Tag>> GetTagsByNameAsync(string searchString = "");
        Task<IEnumerable<Tag>> GetTagsByParentTagIdAsync(int? parentTagId);
    }
}
