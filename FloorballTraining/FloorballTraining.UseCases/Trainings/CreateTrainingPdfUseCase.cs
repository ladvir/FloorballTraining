using FloorballTraining.CoreBusiness;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using FloorballTraining.UseCases.PluginInterfaces;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Trainings
{
    public class CreateTrainingPdfUseCase : ICreateTrainingPdfUseCase
    {
        private readonly ITrainingRepository _trainingRepository;
        private readonly IFileHandlingService _fileHandlingService;
        private readonly AppSettings _appSettings;

        public CreateTrainingPdfUseCase(
            ITrainingRepository trainingRepository,
            IFileHandlingService fileHandlingService, 
            AppSettings appSettings)
        {
            _trainingRepository = trainingRepository;
            _fileHandlingService = fileHandlingService;
            _appSettings = appSettings;
        }

        public async Task<byte[]?> ExecuteAsync(int trainingId, string requestedFrom)
        {
            var training = await _trainingRepository.GetTrainingByIdAsync(trainingId) ?? throw new Exception("Trénink nenalezen");

            var trainingDocument = new TrainingDocument(training, _fileHandlingService, _appSettings, requestedFrom);
           return trainingDocument.GeneratePdf();
        }
    }
}
