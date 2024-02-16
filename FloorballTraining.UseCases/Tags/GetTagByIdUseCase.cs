using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;


public class GetTagByIdUseCase : IGetTagByIdUseCase
{
    private readonly ITagRepository _tagRepository;

    public GetTagByIdUseCase(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }

    public async Task<Tag?> ExecuteAsync(int tagId)
    {
        return await _tagRepository.GetByIdAsync(tagId);
    }
}