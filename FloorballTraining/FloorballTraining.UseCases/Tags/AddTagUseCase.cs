using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Tags.Interfaces;

namespace FloorballTraining.UseCases.Tags
{
    public class AddTagUseCase : IAddTagUseCase
    {
        private readonly ITagRepository _tagRepository;

        public AddTagUseCase(ITagRepository tagRepository)
        {
            _tagRepository = tagRepository;
        }

        public async Task ExecuteAsync(Tag tag)
        {
            await _tagRepository.AddTagAsync(tag);
        }
    }
}
