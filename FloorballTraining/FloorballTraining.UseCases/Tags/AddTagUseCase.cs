using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Tags
{
    public class AddTagUseCase : IAddTagUseCase
    {
        private readonly ITagRepository _tagRepository;
        private readonly ITagFactory _tagFactory;

        public AddTagUseCase(ITagRepository tagRepository, ITagFactory tagFactory)
        {
            _tagRepository = tagRepository;
            _tagFactory = tagFactory;
        }

        public async Task ExecuteAsync(TagDto tagDto)
        {
            var tag = await _tagFactory.GetMergedOrBuild(tagDto);
            await _tagRepository.AddTagAsync(tag);
        }
    }
}
