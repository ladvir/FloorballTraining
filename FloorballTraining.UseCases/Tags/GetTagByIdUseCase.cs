using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;


public class GetTagByIdUseCase(ITagRepository tagRepository) : IGetTagByIdUseCase
{
    public async Task<Tag?> ExecuteAsync(int tagId)
    {
        return await tagRepository.GetByIdAsync(tagId);
    }
}