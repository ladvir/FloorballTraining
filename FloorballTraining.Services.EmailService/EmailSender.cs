using MailKit.Net.Smtp;
using MimeKit;

namespace FloorballTraining.Services.EmailService;

public class EmailSender : IEmailSender
{
    private readonly EmailConfiguration _emailConfig;

    public EmailSender(EmailConfiguration emailConfig)
    {
        _emailConfig = emailConfig;
    }

    public async Task SendEmailAsync(Message message)
    {
        var emailMessage = CreateEmailMessage(message);

        await SendAsync(emailMessage);
    }

    private MimeMessage CreateEmailMessage(Message message)
    {
        var emailMessage = new MimeMessage();
        emailMessage.From.Add(new MailboxAddress(_emailConfig.FromName, _emailConfig.FromAddress));
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
            await client.ConnectAsync(_emailConfig.SmtpServer, _emailConfig.Port, true);
            client.AuthenticationMechanisms.Remove("XOAUTH2");
            await client.AuthenticateAsync(_emailConfig.UserName, _emailConfig.Password);

            await client.SendAsync(mailMessage);
        }
        catch
        {
            //log an error message or throw an exception or both.
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true);
            client.Dispose();
        }
    }
}