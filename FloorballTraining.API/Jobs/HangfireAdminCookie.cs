using System.Security.Cryptography;
using System.Text;

namespace FloorballTraining.API.Jobs;

/// <summary>
/// Helpers for the signed <c>hangfire_admin</c> cookie that grants dashboard access to Admin
/// users via browser navigation (where the in-memory JWT bearer token is unavailable).
///
/// Cookie value format: <c>{base64(userId)}.{unixExpirySeconds}.{base64(HMAC-SHA256)}</c>
/// The HMAC is keyed with <c>JwtSettings:SecretKey</c>, tying the cookie to the same secret
/// as the JWT tokens — a key rotation invalidates both.
/// </summary>
public static class HangfireAdminCookie
{
    public const string Name = "hangfire_admin";
    public const int ExpiryDays = 7;

    public static string Create(string userId, string secretKey)
    {
        ValidateKey(secretKey);
        var expiry = DateTimeOffset.UtcNow.AddDays(ExpiryDays).ToUnixTimeSeconds();
        var hmac = ComputeHmac(userId, expiry, secretKey);
        var userIdB64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(userId));
        return $"{userIdB64}.{expiry}.{Convert.ToBase64String(hmac)}";
    }

    public static bool Validate(string cookieValue, string secretKey)
    {
        if (string.IsNullOrEmpty(secretKey)) return false;

        try
        {
            // Limit to 3 parts to avoid unbounded work on a malicious cookie value.
            var parts = cookieValue.Split('.', 3);
            if (parts.Length != 3) return false;

            var userId = Encoding.UTF8.GetString(Convert.FromBase64String(parts[0]));
            if (!long.TryParse(parts[1], out var expiry)) return false;
            if (DateTimeOffset.FromUnixTimeSeconds(expiry) < DateTimeOffset.UtcNow) return false;

            var expected = ComputeHmac(userId, expiry, secretKey);
            var actual = Convert.FromBase64String(parts[2]);
            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch
        {
            return false;
        }
    }

    private static byte[] ComputeHmac(string userId, long expiry, string secretKey)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        return hmac.ComputeHash(Encoding.UTF8.GetBytes($"{userId}.{expiry}"));
    }

    private static void ValidateKey(string secretKey)
    {
        if (string.IsNullOrEmpty(secretKey))
            throw new InvalidOperationException(
                "JwtSettings:SecretKey must be configured before issuing Hangfire admin cookies.");
    }
}
