using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Activities
{
    public class CreateActivityPdfUseCase : ICreateActivityPdfUseCase
    {
        private readonly IViewActivityByIdUseCase _viewActivityByIdUseCase;
        private readonly IFileHandlingService _fileHandlingService;
        private readonly AppSettings _appSettings;

        public CreateActivityPdfUseCase(
            IViewActivityByIdUseCase viewActivityByIdUseCase,
            IFileHandlingService fileHandlingService,
            AppSettings appSettings
            )
        {
            _viewActivityByIdUseCase = viewActivityByIdUseCase;
            _fileHandlingService = fileHandlingService;
            _appSettings = appSettings;
        }

        public async Task<byte[]?> ExecuteAsync(int activityId, string requestedFrom)
        {
            var activity = await _viewActivityByIdUseCase.ExecuteAsync(activityId) ?? throw new Exception("Aktivita nenalezena");

            return await ExecuteAsync(activity!, requestedFrom);

        }

        public async Task<byte[]?> ExecuteAsync(ActivityDto? activityDto, string requestedFrom)
        {
            if (activityDto == null) throw new ArgumentNullException(nameof(activityDto), "Aktivita nenalezena");

            var activityDocument = new ActivityDocument(activityDto, _fileHandlingService, _appSettings, requestedFrom);

            return await Task.Run(() => activityDocument.GeneratePdf());
        }
    }
}
