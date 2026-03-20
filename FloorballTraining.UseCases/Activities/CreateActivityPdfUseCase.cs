using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using FloorballTraining.UseCases.Activities.Interfaces;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Activities
{
    public class CreateActivityPdfUseCase(
        IViewActivityByIdUseCase viewActivityByIdUseCase,
        IFileHandlingService fileHandlingService,
        AppSettings appSettings)
        : ICreatePdfUseCase<ActivityDto>
    {
        public async Task<byte[]?> ExecuteAsync(int activityId, string requestedFrom, PdfOptions? options = null)
        {
            var activity = await viewActivityByIdUseCase.ExecuteAsync(activityId) ?? throw new Exception("Aktivita nenalezena");

            return await ExecuteAsync(activity, requestedFrom, options);

        }

        public async Task<byte[]?> ExecuteAsync(ActivityDto? activityDto, string requestedFrom, PdfOptions? options = null)
        {
            if (activityDto == null) throw new ArgumentNullException(nameof(activityDto), "Aktivita nenalezena");

            var activityDocument = new ActivityDocument(activityDto, fileHandlingService, appSettings, requestedFrom, options);

            return await Task.Run(() => activityDocument.GeneratePdf());
        }
    }
}
