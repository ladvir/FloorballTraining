using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface ITagRepository : IGenericRepository<Tag>
    {
        Task AddTagAsync(Tag tag);
        Task<IEnumerable<Tag>> GetTagsByParentTagIdAsync(int? parentTagId);
        Task UpdateTagAsync(Tag tag);

        Task DeleteTagAsync(int tagId);

    }
}
