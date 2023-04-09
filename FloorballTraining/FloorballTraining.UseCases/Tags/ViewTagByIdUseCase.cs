using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagByIdUseCase : IViewTagByIdUseCase
{
    private readonly ITagRepository _tagRepository;

    public ViewTagByIdUseCase(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }

    public async Task<Tag> ExecuteAsync(int tagId)
    {
        return await _tagRepository.GetTagByIdAsync(tagId);
    }
}