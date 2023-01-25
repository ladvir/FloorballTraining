using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.TagServices;

public interface ITagService
{
    Task<Tag> CreateTag(Tag tag);
    Task<List<Tag>?> GetAllTags();
    Task<Tag> GetTag(int id);
    Task UpdateTag(Tag tag);
    Task DeleteTag(Tag tag);

    Task CreateCustomTag(Tag tag);
}