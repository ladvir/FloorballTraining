using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Trainings
{
    public class CreateTrainingPdfUseCase(
        IFileHandlingService fileHandlingService,
        IViewTrainingByIdUseCase viewTrainingByIdUseCase,
        AppSettings appSettings)
        : ICreatePdfUseCase<TrainingDto>
    {
        public async Task<byte[]?> ExecuteAsync(int id, string requestedFrom)
        {
            var training = await viewTrainingByIdUseCase.ExecuteAsync(id) ?? throw new Exception("Trénink nenalezen");
            return await ExecuteAsync(training, requestedFrom).ConfigureAwait(false);
        }

        public async Task<byte[]?> ExecuteAsync(TrainingDto? training, string requestedFrom)
        {
            if (training == null) throw new ArgumentNullException(nameof(training));
            var trainingDocument = new TrainingDocument(training, fileHandlingService, appSettings, requestedFrom);
            return await Task.Run(() => trainingDocument.GeneratePdf()).ConfigureAwait(false);
        }
    }
}
