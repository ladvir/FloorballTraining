using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags
{
    public class DeleteTagUseCase : IDeleteTagUseCase
    {
        private readonly ITagRepository _tagRepository;

        public DeleteTagUseCase(ITagRepository tagRepository)
        {
            _tagRepository = tagRepository;
        }

        public async Task ExecuteAsync(Tag tag)
        {
            await _tagRepository.DeleteTagAsync(tag);
        }
    }
}
