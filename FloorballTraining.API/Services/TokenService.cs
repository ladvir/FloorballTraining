using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.IdentityModel.Tokens;

namespace FloorballTraining.API.Services
{
    public class TokenService(IConfiguration config)
    {
        public string CreateToken(AppUser user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, user.UserName!),
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Email, user.Email!)
            };

            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["JwtSettings:SecretKey"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new JwtSecurityToken(
                issuer: config["JwtSettings:Issuer"],
                audience: config["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(AccessTokenExpirationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        }

        /// <summary>Access token lifetime in minutes. Falls back to the legacy key for compatibility.</summary>
        public double AccessTokenExpirationMinutes =>
            double.Parse(config["JwtSettings:AccessTokenExpirationMinutes"]
                         ?? config["JwtSettings:TokenExpirationMinutes"]
                         ?? "15");

        public int RefreshTokenExpirationDays =>
            int.Parse(config["JwtSettings:RefreshTokenExpirationDays"] ?? "7");

        /// <summary>Generates a cryptographically random refresh token (raw value, returned to the client once).</summary>
        public static string GenerateRefreshToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes);
        }

        /// <summary>SHA-256 hash (hex) of a raw refresh token. Only the hash is stored in the DB.</summary>
        public static string HashToken(string rawToken)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
            return Convert.ToHexString(bytes);
        }
    }
}
