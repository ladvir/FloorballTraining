using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Trainings
{
    public class CreateTrainingPdfUseCase(
        IFileHandlingService fileHandlingService,
        AppSettings appSettings)
        : ICreateTrainingPdfUseCase
    {
        public async Task<byte[]?> ExecuteAsync(TrainingDto training, string requestedFrom)
        {
            var trainingDocument = new TrainingDocument(training, fileHandlingService, appSettings, requestedFrom);
            return await Task.Run(() => trainingDocument.GeneratePdf());
        }
    }
}
