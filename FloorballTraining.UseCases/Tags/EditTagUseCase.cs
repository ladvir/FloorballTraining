using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Tags
{
    public class EditTagUseCase : IEditTagUseCase
    {
        private readonly ITagRepository _tagRepository;
        private readonly ITagFactory _tagFactory;

        public EditTagUseCase(ITagRepository tagRepository, ITagFactory tagFactory)
        {
            _tagRepository = tagRepository;
            _tagFactory = tagFactory;
        }

        public async Task ExecuteAsync(TagDto tagDto)
        {
            var tag = await _tagFactory.GetMergedOrBuild(tagDto);
            await _tagRepository.UpdateTagAsync(tag);
        }
    }
}
