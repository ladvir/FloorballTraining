using System.Security.Claims;
using System.Web;
using FloorballTraining.API.Dtos.Auth;
using FloorballTraining.API.Extensions;
using FloorballTraining.API.Jobs;
using FloorballTraining.API.Services;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.Services.EmailService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers
{
    public class AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        TokenService tokenService,
        IClubRoleService clubRoleService,
        IEmailSender emailSender,
        IConfiguration configuration,
        ILogger<AuthController> logger,
        IAuditService auditService,
        FloorballTrainingContext context) : BaseApiController
    {
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitingExtensions.LoginPolicy)]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                await auditService.LogAsync(AuditActions.LoginFailed, userEmail: request.Email,
                    details: new { reason = "user_not_found" });
                return Unauthorized("Neplatné přihlašovací údaje");
            }

            var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid)
            {
                await auditService.LogAsync(AuditActions.LoginFailed, userId: user.Id, userEmail: user.Email,
                    details: new { reason = "invalid_password" });
                return Unauthorized("Neplatné přihlašovací údaje");
            }

            user.LastLoginAt = DateTime.UtcNow;
            await userManager.UpdateAsync(user);

            var roles = await userManager.GetRolesAsync(user);
            var refreshToken = await IssueRefreshTokenAsync(user);
            SetRefreshTokenCookie(refreshToken);
            if (roles.Contains("Admin"))
                SetHangfireAdminCookie(user.Id);
            await auditService.LogAsync(AuditActions.LoginSuccess, userId: user.Id, userEmail: user.Email);
            // Refresh token travels only in the httpOnly cookie (Variant B) - never in the body.
            return await BuildAuthResponseAsync(user, roles);
        }

        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponse>> Refresh()
        {
            var rawToken = Request.Cookies[RefreshCookieName];
            if (string.IsNullOrEmpty(rawToken)) return Unauthorized("Chybí refresh token.");

            var hash = TokenService.HashToken(rawToken);
            var stored = await context.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == hash);
            if (stored == null) return Unauthorized("Neplatný refresh token.");

            // Reuse of an already-revoked token indicates possible theft -> revoke the whole family.
            if (stored.IsRevoked)
            {
                logger.LogWarning("Refresh token reuse detected for user {UserId}", stored.AppUserId);
                await RevokeAllActiveTokensAsync(stored.AppUserId);
                DeleteRefreshTokenCookie();
                return Unauthorized("Refresh token byl zneplatněn. Přihlaste se prosím znovu.");
            }

            if (stored.IsExpired) return Unauthorized("Platnost refresh tokenu vypršela.");

            var user = await userManager.FindByIdAsync(stored.AppUserId);
            if (user == null) return Unauthorized();

            // Rotate: revoke the old token and issue a new pair.
            var newRaw = TokenService.GenerateRefreshToken();
            var newHash = TokenService.HashToken(newRaw);

            stored.RevokedAt = DateTime.UtcNow;
            stored.RevokedByIp = GetClientIp();
            stored.ReplacedByTokenHash = newHash;

            context.RefreshTokens.Add(new RefreshToken
            {
                AppUserId = user.Id,
                TokenHash = newHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(tokenService.RefreshTokenExpirationDays),
                CreatedByIp = GetClientIp()
            });
            await context.SaveChangesAsync();

            SetRefreshTokenCookie(newRaw);
            var roles = await userManager.GetRolesAsync(user);
            if (roles.Contains("Admin"))
                SetHangfireAdminCookie(user.Id);
            return await BuildAuthResponseAsync(user, roles);
        }

        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var rawToken = Request.Cookies[RefreshCookieName];
            if (!string.IsNullOrEmpty(rawToken))
            {
                var hash = TokenService.HashToken(rawToken);
                var stored = await context.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == hash);
                if (stored is { IsActive: true })
                {
                    stored.RevokedAt = DateTime.UtcNow;
                    stored.RevokedByIp = GetClientIp();
                    await context.SaveChangesAsync();
                    await auditService.LogAsync(AuditActions.Logout, userId: stored.AppUserId);
                }
            }

            DeleteRefreshTokenCookie();
            DeleteHangfireAdminCookie();
            return Ok(new { message = "Odhlášení proběhlo úspěšně." });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<AuthResponse>> GetCurrentUser()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<ActionResult<AuthResponse>> UpdateProfile([FromBody] Dtos.Auth.UpdateProfileDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            if (!string.IsNullOrEmpty(dto.FirstName))
                user.FirstName = dto.FirstName.Trim();
            if (!string.IsNullOrEmpty(dto.LastName))
                user.LastName = dto.LastName.Trim();

            // Email change
            string? oldEmail = null;
            if (!string.IsNullOrEmpty(dto.Email) && dto.Email.Trim() != user.Email)
            {
                var newEmail = dto.Email.Trim();
                var existing = await userManager.FindByEmailAsync(newEmail);
                if (existing != null)
                    return BadRequest(new { message = "Tento email je již registrován." });

                oldEmail = user.Email;
                user.Email = newEmail;
                user.NormalizedEmail = newEmail.ToUpperInvariant();
                user.UserName = newEmail;
                user.NormalizedUserName = newEmail.ToUpperInvariant();
            }

            // Password change
            var passwordChanged = false;
            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                if (string.IsNullOrEmpty(dto.CurrentPassword))
                    return BadRequest(new { message = "Pro změnu hesla zadejte aktuální heslo." });

                var passResult = await userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
                if (!passResult.Succeeded)
                    return BadRequest(new { message = string.Join("; ", passResult.Errors.Select(e => e.Description)) });
                passwordChanged = true;
            }

            await userManager.UpdateAsync(user);

            if (oldEmail != null)
                await auditService.LogAsync(AuditActions.EmailChanged, "User", user.Id,
                    details: new { oldEmail, newEmail = user.Email });
            if (passwordChanged)
                await auditService.LogAsync(AuditActions.PasswordChanged, "User", user.Id);

            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
        }

        [Authorize]
        [HttpPut("preferences")]
        public async Task<ActionResult<AuthResponse>> UpdatePreferences([FromBody] UserPreferencesDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            user.DefaultClubId = dto.DefaultClubId;
            user.DefaultTeamId = dto.DefaultTeamId;
            await userManager.UpdateAsync(user);

            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
        }

        /// <summary>Persist the user's preferred UI language (e.g. "cs", "en").</summary>
        [Authorize]
        [HttpPut("language")]
        public async Task<ActionResult<AuthResponse>> UpdateLanguage([FromBody] UpdateLanguageDto dto)
        {
            var lang = (dto.Language ?? string.Empty).Trim().ToLowerInvariant();
            // Accept a short language code only (e.g. "cs", "en", "de-at").
            if (lang.Length is < 2 or > 5)
                return BadRequest(new { error = "Neplatný kód jazyka." });

            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            user.PreferredLanguage = lang;
            await userManager.UpdateAsync(user);

            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
        }

        [Authorize]
        [HttpPut("active-club")]
        public async Task<ActionResult<AuthResponse>> SetActiveClub([FromBody] SetActiveClubDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            var roles = await userManager.GetRolesAsync(user);
            var isAdmin = roles.Contains("Admin");

            if (!isAdmin)
            {
                var hasMembership = await context.Members
                    .AnyAsync(m => m.AppUserId == user.Id && m.ClubId == dto.ClubId);
                if (!hasMembership)
                    return BadRequest("Nejste členem tohoto klubu.");
            }

            user.DefaultClubId = dto.ClubId;
            user.DefaultTeamId = null;
            await userManager.UpdateAsync(user);

            return await BuildAuthResponseAsync(user, roles);
        }

        [AllowAnonymous]
        [EnableRateLimiting(RateLimitingExtensions.ForgotPasswordPolicy)]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                var user = await userManager.FindByEmailAsync(request.Email);
                if (user != null)
                {
                    var token = await userManager.GeneratePasswordResetTokenAsync(user);
                    var frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:3000";
                    var encodedToken = HttpUtility.UrlEncode(token);
                    var encodedEmail = HttpUtility.UrlEncode(request.Email);
                    var resetLink = $"{frontendBaseUrl.TrimEnd('/')}/reset-password?email={encodedEmail}&token={encodedToken}";

                    var message = new Message(
                        [request.Email],
                        "Reset hesla - FloTr",
                        $"<h2>Reset hesla</h2>" +
                        $"<p>Pro nastavení nového hesla klikněte na následující odkaz:</p>" +
                        $"<p><a href=\"{resetLink}\">Resetovat heslo</a></p>" +
                        $"<p>Pokud jste o reset hesla nežádali, tento email ignorujte.</p>" +
                        $"<p>Odkaz je platný po omezenou dobu.</p>");

                    try
                    {
                        await emailSender.SendEmailAsync(message);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Failed to send password reset email to {Email}", request.Email);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unexpected error in ForgotPassword for {Email}", request.Email);
            }

            // Always return OK to not reveal if email exists or whether SMTP succeeded
            return Ok(new { message = "Pokud email existuje v systému, odeslali jsme instrukce pro reset hesla." });
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return BadRequest(new { message = "Neplatný požadavek na reset hesla." });

            var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            await auditService.LogAsync(AuditActions.PasswordReset, "User", user.Id, userId: user.Id, userEmail: user.Email);

            return Ok(new { message = "Heslo bylo úspěšně změněno." });
        }

        [AllowAnonymous]
        [HttpGet("providers")]
        public IActionResult GetProviders()
        {
            return Ok(new
            {
                google = !string.IsNullOrEmpty(configuration["OAuth:Google:ClientId"]),
                microsoft = !string.IsNullOrEmpty(configuration["OAuth:Microsoft:ClientId"])
            });
        }

        [AllowAnonymous]
        [HttpGet("external/{provider}")]
        public IActionResult ExternalLogin(string provider, [FromQuery] string? returnUrl = null)
        {
            var redirectUrl = Url.Action(nameof(ExternalLoginCallback), new { provider, returnUrl });
            var properties = signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
            return Challenge(properties, provider);
        }

        [AllowAnonymous]
        [HttpGet("external/{provider}/callback")]
        public async Task<IActionResult> ExternalLoginCallback(string provider, [FromQuery] string? returnUrl = null)
        {
            var frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:3000";

            var info = await signInManager.GetExternalLoginInfoAsync();
            if (info == null)
                return Redirect($"{frontendBaseUrl.TrimEnd('/')}/login?error=external_failed");

            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Redirect($"{frontendBaseUrl.TrimEnd('/')}/login?error=external_no_email");

            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                // Create new user
                var firstName = info.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "";
                var lastName = info.Principal.FindFirstValue(ClaimTypes.Surname) ?? "";
                user = new AppUser
                {
                    UserName = email,
                    Email = email,
                    NormalizedEmail = email.ToUpperInvariant(),
                    NormalizedUserName = email.ToUpperInvariant(),
                    FirstName = firstName,
                    LastName = lastName,
                    EmailConfirmed = true,
                };
                var createResult = await userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return Redirect($"{frontendBaseUrl.TrimEnd('/')}/login?error=external_create_failed");

                await userManager.AddToRoleAsync(user, "User");
            }

            // Link external login if not already linked
            var logins = await userManager.GetLoginsAsync(user);
            if (!logins.Any(l => l.LoginProvider == info.LoginProvider && l.ProviderKey == info.ProviderKey))
            {
                await userManager.AddLoginAsync(user, info);
            }

            user.LastLoginAt = DateTime.UtcNow;
            await userManager.UpdateAsync(user);

            await auditService.LogAsync(
                AuditActions.LoginExternal, "User", user.Id,
                details: new { provider = info.LoginProvider },
                userId: user.Id, userEmail: user.Email);

            var roles = await userManager.GetRolesAsync(user);
            var jwt = tokenService.CreateToken(user, roles);

            return Redirect($"{frontendBaseUrl.TrimEnd('/')}/login?token={Uri.EscapeDataString(jwt)}");
        }

        private async Task<AuthResponse> BuildAuthResponseAsync(AppUser user, IList<string> roles, string? refreshToken = null)
        {
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(user.Id);
            var clubMemberships = await clubRoleService.GetAllUserClubRolesAsync(user.Id);
            var accessToken = tokenService.CreateToken(user, roles);
            return new AuthResponse
            {
                Id = user.Id,
                Token = accessToken,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles,
                DefaultClubId = user.DefaultClubId,
                DefaultTeamId = user.DefaultTeamId,
                PreferredLanguage = user.PreferredLanguage,
                EffectiveRole = roleInfo.EffectiveRole,
                AccountType = roleInfo.EffectiveRole == "User" ? "Player" : "Coach",
                ClubId = roleInfo.ClubId,
                CoachTeamIds = roleInfo.CoachTeamIds,
                ClubMemberships = clubMemberships,
            };
        }

        private async Task<string> IssueRefreshTokenAsync(AppUser user)
        {
            var raw = TokenService.GenerateRefreshToken();
            context.RefreshTokens.Add(new RefreshToken
            {
                AppUserId = user.Id,
                TokenHash = TokenService.HashToken(raw),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(tokenService.RefreshTokenExpirationDays),
                CreatedByIp = GetClientIp()
            });
            await context.SaveChangesAsync();
            return raw;
        }

        private async Task RevokeAllActiveTokensAsync(string userId)
        {
            var active = await context.RefreshTokens
                .Where(rt => rt.AppUserId == userId && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var token in active)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = GetClientIp();
            }

            if (active.Count > 0)
                await context.SaveChangesAsync();
        }

        private string? GetClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();

        private const string RefreshCookieName = "flotr_refresh";

        private void SetRefreshTokenCookie(string rawToken) =>
            Response.Cookies.Append(RefreshCookieName, rawToken, BuildRefreshCookieOptions(
                DateTimeOffset.UtcNow.AddDays(tokenService.RefreshTokenExpirationDays)));

        private void DeleteRefreshTokenCookie() =>
            Response.Cookies.Append(RefreshCookieName, string.Empty, BuildRefreshCookieOptions(
                DateTimeOffset.UnixEpoch));

        // Path "/" because the SPA reaches the API under different prefixes per environment
        // (dev: /api/auth/*, prod: /flotr/api/auth/*); a narrower path would not match.
        // Still httpOnly + Secure + SameSite=Strict, so it is XSS- and CSRF-safe.
        private static CookieOptions BuildRefreshCookieOptions(DateTimeOffset expires) => new()
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = expires
        };

        private void SetHangfireAdminCookie(string userId)
        {
            var secretKey = configuration["JwtSettings:SecretKey"]!;
            Response.Cookies.Append(
                HangfireAdminCookie.Name,
                HangfireAdminCookie.Create(userId, secretKey),
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Path = "/",
                    Expires = DateTimeOffset.UtcNow.AddDays(HangfireAdminCookie.ExpiryDays),
                });
        }

        private void DeleteHangfireAdminCookie() =>
            Response.Cookies.Delete(HangfireAdminCookie.Name, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/",
            });

    }
}
