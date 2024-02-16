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

        public async Task ExecuteAsync(int tagId)
        {
            await _tagRepository.DeleteTagAsync(tagId);
        }
    }
}
