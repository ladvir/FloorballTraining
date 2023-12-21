using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags
{
    public class EditTagUseCase : IEditTagUseCase
    {
        private readonly ITagRepository _tagRepository;

        public EditTagUseCase(ITagRepository tagRepository)
        {
            _tagRepository = tagRepository;
        }

        public async Task ExecuteAsync(Tag tag)
        {
            await _tagRepository.UpdateTagAsync(tag);
        }
    }
}
