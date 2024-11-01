using MailKit.Net.Smtp;
using MimeKit;

namespace FloorballTraining.Services.EmailService;

public class EmailSender(EmailConfiguration emailConfig) : IEmailSender
{
    public async Task SendEmailAsync(Message message)
    {
        var emailMessage = CreateEmailMessage(message);

        await SendAsync(emailMessage);
    }

    private MimeMessage CreateEmailMessage(Message message)
    {
        var emailMessage = new MimeMessage();
        emailMessage.From.Add(new MailboxAddress(emailConfig.FromName, emailConfig.FromAddress));
        emailMessage.To.AddRange(message.To);
        emailMessage.Subject = message.Subject;


        var bodyBuilder = new BodyBuilder { HtmlBody = $"<div style='color:black;'>{message.Content}</div>" };

        if (message.Attachments.Any())
        {
            foreach (var attachment in message.Attachments)
            {
                var ms = new MemoryStream();
                attachment.ContentStream.CopyTo(ms);
                bodyBuilder.Attachments.Add(attachment.Name, ms.ToArray());
            }
        }

        emailMessage.Body = bodyBuilder.ToMessageBody();


        return emailMessage;
    }

    private async Task SendAsync(MimeMessage mailMessage)
    {
        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(emailConfig.SmtpServer, emailConfig.Port, true);
            client.AuthenticationMechanisms.Remove("XOAUTH2");
            await client.AuthenticateAsync(emailConfig.UserName, emailConfig.Password);

            await client.SendAsync(mailMessage);
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }
}