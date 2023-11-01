using FloorballTraining.Services;
using FloorballTraining.UseCases.PluginInterfaces;
using QuestPDF.Fluent;

namespace FloorballTraining.UseCases.Trainings
{
    public class CreateTrainingPdfUseCase : ICreateTrainingPdfUseCase
    {
        private readonly ITrainingRepository _trainingRepository;
        private readonly IFileHandlingService _fileHandlingService;

        public CreateTrainingPdfUseCase(
            ITrainingRepository TrainingRepository,
            IFileHandlingService fileHandlingService)
        {
            _trainingRepository = TrainingRepository;
            _fileHandlingService = fileHandlingService;
        }

        public async Task<byte[]?> ExecuteAsync(int TrainingId)
        {
            var Training = await _trainingRepository.GetTrainingByIdAsync(TrainingId) ?? throw new Exception("Trénink nenalezen");

            var TrainingDocument = new TrainingDocument(Training, _fileHandlingService);
            return TrainingDocument.GeneratePdf();
        }
    }
}
