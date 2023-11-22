using System.Net.Mail;
using System.Net.Mime;
using FloorballTraining.Services;
using FloorballTraining.Services.EmailService;

namespace FloorballTraining.UseCases.Trainings;

public class SendTrainingViaEmailUseCase : ISendTrainingViaEmailUseCase
{
    private readonly ICreateTrainingPdfUseCase _createTrainingPdfUseCase;
    private readonly IEmailSender _emailSender;
    private readonly IViewTrainingByIdUseCase _viewTrainingByIdUseCase;
    private readonly IFileHandlingService _fileHandlingService;

    public SendTrainingViaEmailUseCase(ICreateTrainingPdfUseCase createTrainingPdfUseCase, IEmailSender emailSender, IViewTrainingByIdUseCase viewTrainingByIdUseCase, IFileHandlingService fileHandlingService)
    {
        _createTrainingPdfUseCase = createTrainingPdfUseCase;
        _emailSender = emailSender;
        _viewTrainingByIdUseCase = viewTrainingByIdUseCase;
        _fileHandlingService = fileHandlingService;
    }

    public async Task ExecuteAsync(List<int> trainingIds, string[] to)
    {

        var attachments = new List<Attachment>();

        List<string> trainingNames = new();
        foreach (var trainingId in trainingIds)
        {
            var training = await _viewTrainingByIdUseCase.ExecuteAsync(trainingId);
            if (training == null) continue;

            trainingNames.Add(training.Name);

            var pdfFile = await _createTrainingPdfUseCase.ExecuteAsync(training, string.Empty);



            if (pdfFile != null)
            {
                var pdfStream = new MemoryStream(pdfFile);
                var fileName = _fileHandlingService.GetFileOrDirectoryValidName(training.Name) + ".pdf";

                var attachment = new Attachment(pdfStream, fileName, MediaTypeNames.Application.Pdf);
                attachments.Add(attachment);
            }

        }



        var message = new Message(to, $"Vybrané tréninky", $"V příloze najdeš informace o vybraných treninzích: {string.Join(", ", trainingNames)}", attachments);
        await _emailSender.SendEmailAsync(message);

    }
}