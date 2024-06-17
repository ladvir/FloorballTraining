using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Tags
{
    public class EditTagUseCase(ITagRepository tagRepository, ITagFactory tagFactory) : IEditTagUseCase
    {
        public async Task ExecuteAsync(TagDto tagDto)
        {
            var tag = await tagFactory.GetMergedOrBuild(tagDto);
            await tagRepository.UpdateTagAsync(tag);
        }
    }
}
