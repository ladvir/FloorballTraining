using System.Net.Mail;
using MimeKit;

namespace FloorballTraining.Services.EmailService
{
    public class Message
    {
        public List<MailboxAddress> To { get; set; }
        public string Subject { get; set; }
        public string Content { get; set; }

        public List<Attachment> Attachments { get; set; } = new();


        public Message(IEnumerable<string> to, string subject, string content, IReadOnlyCollection<Attachment> attachments)
        {
            To = new List<MailboxAddress>();

            To.AddRange(to.Select(x => new MailboxAddress(x, x)));
            Subject = subject;
            Content = content;

            if (attachments.Any())
            {
                Attachments.AddRange(attachments);
            }
        }
    }
}