using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagByParentTagIdUseCase : IViewTagByParentTagIdUseCase
{
    private readonly ITagRepository _tagRepository;

    public ViewTagByParentTagIdUseCase(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }


    public async Task<IEnumerable<Tag>> ExecuteAsync(int? parentTagId)
    {
        return await _tagRepository.GetTagsByParentTagIdAsync(parentTagId);
    }
}