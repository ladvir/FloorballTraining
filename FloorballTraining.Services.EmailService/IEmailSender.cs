namespace FloorballTraining.Services.EmailService;

public interface IEmailSender
{
    Task SendEmailAsync(Message message);
}