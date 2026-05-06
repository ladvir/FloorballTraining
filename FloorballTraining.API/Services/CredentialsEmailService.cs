using FloorballTraining.Services.EmailService;

namespace FloorballTraining.API.Services
{
    public interface ICredentialsEmailService
    {
        Task SendWelcomeAsync(string toEmail, string? firstName, string password);
        Task SendPasswordResetAsync(string toEmail, string? firstName, string password);
    }

    public class CredentialsEmailService(
        IEmailSender emailSender,
        IConfiguration configuration,
        ILogger<CredentialsEmailService> logger) : ICredentialsEmailService
    {
        public Task SendWelcomeAsync(string toEmail, string? firstName, string password)
        {
            var (loginUrl, profileUrl) = GetUrls();
            var greeting = BuildGreeting(firstName);

            var content =
                $"<h2>Vítejte ve FloTr</h2>" +
                $"<p>{greeting},</p>" +
                $"<p>do aplikace FloTr vám byl založen účet. Níže najdete přihlašovací údaje:</p>" +
                BuildCredentialsBlock(toEmail, password) +
                $"<p>Přihlásit se můžete zde: <a href=\"{loginUrl}\">{loginUrl}</a></p>" +
                $"<h3>Doporučujeme co nejdříve změnit heslo</h3>" +
                BuildChangePasswordSteps(profileUrl) +
                $"<p>Pokud jste tento email nečekali, kontaktujte správce vašeho klubu.</p>";

            return SendAsync(toEmail, "Vítejte ve FloTr - přihlašovací údaje", content);
        }

        public Task SendPasswordResetAsync(string toEmail, string? firstName, string password)
        {
            var (loginUrl, profileUrl) = GetUrls();
            var greeting = BuildGreeting(firstName);

            var content =
                $"<h2>Reset hesla ve FloTr</h2>" +
                $"<p>{greeting},</p>" +
                $"<p>správce vašeho klubu vám resetoval heslo do aplikace FloTr. " +
                $"Vaše původní heslo již nelze použít. Nové přihlašovací údaje jsou:</p>" +
                BuildCredentialsBlock(toEmail, password) +
                $"<p>Přihlásit se můžete zde: <a href=\"{loginUrl}\">{loginUrl}</a></p>" +
                $"<h3>Doporučujeme co nejdříve změnit heslo</h3>" +
                $"<p>Toto heslo bylo vygenerováno automaticky. Z bezpečnostních důvodů si jej prosím co nejdříve změňte ve svém profilu. Postup:</p>" +
                BuildChangePasswordSteps(profileUrl) +
                $"<p>Pokud jste reset hesla nepožadovali, kontaktujte prosím obratem správce vašeho klubu.</p>";

            return SendAsync(toEmail, "Reset hesla - FloTr", content);
        }

        private (string loginUrl, string profileUrl) GetUrls()
        {
            var frontendBaseUrl = (configuration["FrontendBaseUrl"] ?? "http://localhost:3000").TrimEnd('/');
            return ($"{frontendBaseUrl}/login", $"{frontendBaseUrl}/profile");
        }

        private static string BuildGreeting(string? firstName) =>
            string.IsNullOrWhiteSpace(firstName) ? "Dobrý den" : $"Dobrý den {firstName}";

        private static string BuildCredentialsBlock(string email, string password) =>
            $"<ul>" +
            $"<li><strong>Uživatelské jméno (email):</strong> {email}</li>" +
            $"<li><strong>Heslo:</strong> {System.Net.WebUtility.HtmlEncode(password)}</li>" +
            $"</ul>";

        private static string BuildChangePasswordSteps(string profileUrl) =>
            $"<ol>" +
            $"<li>Přihlaste se výše uvedenými údaji.</li>" +
            $"<li>Otevřete <a href=\"{profileUrl}\">svůj profil</a> (vpravo nahoře v menu uživatele &rarr; Profil).</li>" +
            $"<li>V sekci <em>Změna hesla</em> vyplňte aktuální heslo a dvakrát své nové heslo.</li>" +
            $"<li>Heslo musí mít alespoň 6 znaků.</li>" +
            $"<li>Klikněte na tlačítko <em>Uložit</em>.</li>" +
            $"</ol>";

        private async Task SendAsync(string toEmail, string subject, string content)
        {
            var message = new Message([toEmail], subject, content);
            try
            {
                await emailSender.SendEmailAsync(message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send credentials email to {Email}", toEmail);
                throw;
            }
        }
    }
}
