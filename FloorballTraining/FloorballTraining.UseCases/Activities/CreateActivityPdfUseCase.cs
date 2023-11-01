using FloorballTraining.Services;
using FloorballTraining.UseCases.PluginInterfaces;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Activities
{
    public class CreateActivityPdfUseCase : ICreateActivityPdfUseCase
    {
        private readonly IActivityRepository _activityRepository;
        private readonly IFileHandlingService _fileHandlingService;

        public CreateActivityPdfUseCase(
            IActivityRepository activityRepository,
            IFileHandlingService fileHandlingService)
        {
            _activityRepository = activityRepository;
            _fileHandlingService = fileHandlingService;
        }

        public async Task<byte[]?> ExecuteAsync(int activityId)
        {
            var activity = await _activityRepository.GetActivityByIdAsync(activityId) ?? throw new Exception("Aktivita nenalezena");


            var activityDocument = new ActivityDocument(activity, _fileHandlingService);
            return activityDocument.GeneratePdf();
        }
    }
}
