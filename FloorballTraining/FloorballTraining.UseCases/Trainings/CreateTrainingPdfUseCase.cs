using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Trainings
{
    public class CreateTrainingPdfUseCase : ICreateTrainingPdfUseCase
    {
        private readonly IFileHandlingService _fileHandlingService;
        private readonly AppSettings _appSettings;

        public CreateTrainingPdfUseCase(
            IFileHandlingService fileHandlingService,
            AppSettings appSettings)
        {

            _fileHandlingService = fileHandlingService;
            _appSettings = appSettings;
        }

        public async Task<byte[]?> ExecuteAsync(TrainingDto training, string requestedFrom)
        {
            var trainingDocument = new TrainingDocument(training, _fileHandlingService, _appSettings, requestedFrom);
            return await Task.Run(() => trainingDocument.GeneratePdf());
        }
    }
}
