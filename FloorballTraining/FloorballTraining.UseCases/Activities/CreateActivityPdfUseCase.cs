using FloorballTraining.CoreBusiness;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using FloorballTraining.UseCases.PluginInterfaces;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Activities
{
    public class CreateActivityPdfUseCase : ICreateActivityPdfUseCase
    {
        private readonly IActivityRepository _activityRepository;
        private readonly IFileHandlingService _fileHandlingService;
        private readonly AppSettings _appSettings;

        public CreateActivityPdfUseCase(
            IActivityRepository activityRepository,
            IFileHandlingService fileHandlingService,
            AppSettings appSettings
            )
        {
            _activityRepository = activityRepository;
            _fileHandlingService = fileHandlingService;
            _appSettings = appSettings;
        }

        public async Task<byte[]?> ExecuteAsync(int activityId, string requestedFrom)
        {
            var activity = await _activityRepository.GetActivityByIdAsync(activityId) ?? throw new Exception("Aktivita nenalezena");

            var activityDocument = new ActivityDocument(activity, _fileHandlingService, _appSettings, requestedFrom);
            return activityDocument.GeneratePdf();
        }
    }
}
