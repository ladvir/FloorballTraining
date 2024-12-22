using System.Net.Mail;
using System.Net.Mime;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Services;
using FloorballTraining.Services.EmailService;
using FloorballTraining.UseCases.Activities.Interfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class SendActivityViaEmailUseCase(
        ICreatePdfUseCase<ActivityDto> createActivityPdfUseCase,
        IEmailSender emailSender,
        IViewActivityByIdUseCase viewActivityByIdUseCase,
        IFileHandlingService fileHandlingService)
        : ISendActivityViaEmailUseCase
    {
        public async Task ExecuteAsync(List<int> activityIds, string[] to)
        {

            var attachments = new List<Attachment>();

            List<string> activityNames = new();
            foreach (var activityId in activityIds)
            {
                var activity = await viewActivityByIdUseCase.ExecuteAsync(activityId);
                if (activity == null) continue;
                activityNames.Add(activity.Name);

                var pdfFile = await createActivityPdfUseCase.ExecuteAsync(activity, string.Empty);



                if (pdfFile != null)
                {
                    var pdfStream = new MemoryStream(pdfFile);
                    var fileName = fileHandlingService.GetFileOrDirectoryValidName(activity.Name) + ".pdf";

                    var attachment = new Attachment(pdfStream, fileName, MediaTypeNames.Application.Pdf);
                    attachments.Add(attachment);
                }

            }



            var message = new Message(to, $"Vybrané aktivity", $"V příloze najdeš informace o vybraných aktivitách: {string.Join(", ", activityNames)}", attachments);
            await emailSender.SendEmailAsync(message);

        }
    }
}
