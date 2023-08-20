using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags;

public class ViewTagByNameUseCase : IViewTagByNameUseCase
{
    private readonly ITagRepository _tagRepository;

    public ViewTagByNameUseCase(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }


    public async Task<IEnumerable<Tag>> ExecuteAsync(string searchString = "", bool trainingGoalsOnly = false)
    {
        return await _tagRepository.GetTagsByNameAsync(searchString, trainingGoalsOnly);
    }
}