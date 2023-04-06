using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Tags.Interfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagByNameUseCase : IViewTagByNameUseCase
{
    private readonly ITagRepository _tagRepository;

    public ViewTagByNameUseCase(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }


    public async Task<IEnumerable<Tag>> ExecuteAsync(string searchString = "")
    {
        return await _tagRepository.GetTagsByNameAsync(searchString);
    }
}