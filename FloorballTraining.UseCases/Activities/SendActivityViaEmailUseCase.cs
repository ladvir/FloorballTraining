using System.Net.Mail;
using System.Net.Mime;
using FloorballTraining.Services;
using FloorballTraining.Services.EmailService;

namespace FloorballTraining.UseCases.Activities
{
    public class SendActivityViaEmailUseCase : ISendActivityViaEmailUseCase
    {
        private readonly ICreateActivityPdfUseCase _createActivityPdfUseCase;
        private readonly IEmailSender _emailSender;
        private readonly IViewActivityByIdUseCase _viewActivityByIdUseCase;
        private readonly IFileHandlingService _fileHandlingService;

        public SendActivityViaEmailUseCase(ICreateActivityPdfUseCase createActivityPdfUseCase, IEmailSender emailSender, IViewActivityByIdUseCase viewActivityByIdUseCase, IFileHandlingService fileHandlingService)
        {
            _createActivityPdfUseCase = createActivityPdfUseCase;
            _emailSender = emailSender;
            _viewActivityByIdUseCase = viewActivityByIdUseCase;
            _fileHandlingService = fileHandlingService;
        }

        public async Task ExecuteAsync(List<int> activityIds, string[] to)
        {

            var attachments = new List<Attachment>();

            List<string> activityNames = new();
            foreach (var activityId in activityIds)
            {
                var activity = await _viewActivityByIdUseCase.ExecuteAsync(activityId);
                if (activity == null) continue;
                activityNames.Add(activity.Name);

                var pdfFile = await _createActivityPdfUseCase.ExecuteAsync(activity, string.Empty);



                if (pdfFile != null)
                {
                    var pdfStream = new MemoryStream(pdfFile);
                    var fileName = _fileHandlingService.GetFileOrDirectoryValidName(activity.Name) + ".pdf";

                    var attachment = new Attachment(pdfStream, fileName, MediaTypeNames.Application.Pdf);
                    attachments.Add(attachment);
                }

            }



            var message = new Message(to, $"Vybrané aktivity", $"V příloze najdeš informace o vybraných aktivitách: {string.Join(", ", activityNames)}", attachments);
            await _emailSender.SendEmailAsync(message);

        }
    }
}
