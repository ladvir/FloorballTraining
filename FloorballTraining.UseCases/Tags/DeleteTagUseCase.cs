using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Tags
{
    public class DeleteTagUseCase(ITagRepository tagRepository) : IDeleteTagUseCase
    {
        public async Task ExecuteAsync(int tagId)
        {
            await tagRepository.DeleteTagAsync(tagId);
        }
    }
}
