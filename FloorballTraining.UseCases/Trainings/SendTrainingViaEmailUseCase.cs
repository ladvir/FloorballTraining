using System.Net.Mail;
using System.Net.Mime;
using FloorballTraining.Services;
using FloorballTraining.Services.EmailService;

namespace FloorballTraining.UseCases.Trainings;

public class SendTrainingViaEmailUseCase(
    ICreateTrainingPdfUseCase createTrainingPdfUseCase,
    IEmailSender emailSender,
    IViewTrainingByIdUseCase viewTrainingByIdUseCase,
    IFileHandlingService fileHandlingService)
    : ISendTrainingViaEmailUseCase
{
    public async Task ExecuteAsync(List<int> trainingIds, string[] to)
    {

        var attachments = new List<Attachment>();

        List<string> trainingNames = new();
        foreach (var trainingId in trainingIds)
        {
            var training = await viewTrainingByIdUseCase.ExecuteAsync(trainingId);
            if (training == null) continue;

            trainingNames.Add(training.Name);

            var pdfFile = await createTrainingPdfUseCase.ExecuteAsync(training, string.Empty);



            if (pdfFile != null)
            {
                var pdfStream = new MemoryStream(pdfFile);
                var fileName = fileHandlingService.GetFileOrDirectoryValidName(training.Name) + ".pdf";

                var attachment = new Attachment(pdfStream, fileName, MediaTypeNames.Application.Pdf);
                attachments.Add(attachment);
            }
        }

        var message = new Message(to, $"Vybrané tréninky", $"V příloze najdeš informace o vybraných treninzích: {string.Join(", ", trainingNames)}", attachments);
        await emailSender.SendEmailAsync(message);

    }
}