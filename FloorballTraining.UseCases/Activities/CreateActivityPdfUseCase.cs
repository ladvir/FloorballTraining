using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Activities
{
    public class CreateActivityPdfUseCase(
        IViewActivityByIdUseCase viewActivityByIdUseCase,
        IFileHandlingService fileHandlingService,
        AppSettings appSettings)
        : ICreateActivityPdfUseCase
    {
        public async Task<byte[]?> ExecuteAsync(int activityId, string requestedFrom)
        {
            var activity = await viewActivityByIdUseCase.ExecuteAsync(activityId) ?? throw new Exception("Aktivita nenalezena");

            return await ExecuteAsync(activity!, requestedFrom);

        }

        public async Task<byte[]?> ExecuteAsync(ActivityDto? activityDto, string requestedFrom)
        {
            if (activityDto == null) throw new ArgumentNullException(nameof(activityDto), "Aktivita nenalezena");

            var activityDocument = new ActivityDocument(activityDto, fileHandlingService, appSettings, requestedFrom);

            return await Task.Run(() => activityDocument.GeneratePdf());
        }
    }
}
