using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagByParentTagIdUseCase(ITagRepository tagRepository) : IViewTagByParentTagIdUseCase
{
    public async Task<IEnumerable<Tag>> ExecuteAsync(int? parentTagId)
    {
        return await tagRepository.GetTagsByParentTagIdAsync(parentTagId);
    }
}