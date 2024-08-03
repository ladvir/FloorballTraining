using FloorballTraining.Services.EmailService;
using FloorballTraining.UseCases.Errors.Interfaces;

namespace FloorballTraining.UseCases.Errors
{
    public class SendErrorViaEmailUseCase(IEmailSender emailSender) : ISendErrorViaEmailUseCase
    {
        public async Task ExecuteAsync(Exception exception, IReadOnlyList<string> to)
        {
            var content = $"<h2>{exception.TargetSite}</h2><div><h3>Message:</h3>{exception.Message} </div><div><h3>Stack trace:</h3> {exception.StackTrace} ";
            var message = new Message(to, $"Reportovaná chyba", content);
            await emailSender.SendEmailAsync(message);
        }
    }
}