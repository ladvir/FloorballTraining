using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Tags
{
    public class AddTagUseCase(ITagRepository tagRepository, ITagFactory tagFactory) : IAddTagUseCase
    {
        public async Task ExecuteAsync(TagDto tagDto)
        {
            var tag = await tagFactory.GetMergedOrBuild(tagDto);
            await tagRepository.AddTagAsync(tag);
        }
    }
}
