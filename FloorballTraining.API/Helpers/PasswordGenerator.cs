using System.Security.Cryptography;

namespace FloorballTraining.API.Helpers;

/// <summary>Generates cryptographically-random temporary passwords that satisfy Identity rules.</summary>
public static class PasswordGenerator
{
    private const string Lower = "abcdefghijkmnopqrstuvwxyz";
    private const string Upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const string Digits = "23456789";
    private const string Special = "!@#$%&*";

    public static string GenerateTemporary()
    {
        const string all = Lower + Upper + Digits + Special;
        using var rng = RandomNumberGenerator.Create();

        char Pick(string source)
        {
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var index = (int)(BitConverter.ToUInt32(bytes, 0) % (uint)source.Length);
            return source[index];
        }

        var chars = new List<char> { Pick(Lower), Pick(Upper), Pick(Digits), Pick(Special) };
        for (var i = 0; i < 8; i++) chars.Add(Pick(all));

        // Fisher-Yates shuffle
        for (var i = chars.Count - 1; i > 0; i--)
        {
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var j = (int)(BitConverter.ToUInt32(bytes, 0) % (uint)(i + 1));
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }
        return new string(chars.ToArray());
    }
}
