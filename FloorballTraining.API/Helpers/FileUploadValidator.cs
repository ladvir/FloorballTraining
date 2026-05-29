namespace FloorballTraining.API.Helpers;

public enum FileValidationResult
{
    Valid,
    Empty,
    TooLarge,
    UnsupportedType
}

/// <summary>
/// Validates uploaded files against a size limit, an extension/MIME whitelist
/// and magic-byte signatures (so the real file type is checked, not just the
/// client-supplied extension or content type).
/// </summary>
public static class FileUploadValidator
{
    public static FileValidationResult Validate(
        IFormFile? file,
        long maxBytes,
        IReadOnlySet<string> allowedExtensions,
        IReadOnlySet<string> allowedContentTypes,
        IReadOnlyList<byte[]> allowedSignatures)
    {
        if (file is null || file.Length == 0)
            return FileValidationResult.Empty;

        if (file.Length > maxBytes)
            return FileValidationResult.TooLarge;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            return FileValidationResult.UnsupportedType;

        if (!allowedContentTypes.Contains(file.ContentType))
            return FileValidationResult.UnsupportedType;

        if (!HasAllowedSignature(file, allowedSignatures))
            return FileValidationResult.UnsupportedType;

        return FileValidationResult.Valid;
    }

    private static bool HasAllowedSignature(IFormFile file, IReadOnlyList<byte[]> allowedSignatures)
    {
        if (allowedSignatures.Count == 0)
            return true;

        var maxLength = allowedSignatures.Max(s => s.Length);
        var header = new byte[maxLength];

        using var stream = file.OpenReadStream();
        var read = stream.Read(header, 0, maxLength);

        return allowedSignatures.Any(signature =>
            read >= signature.Length && header.Take(signature.Length).SequenceEqual(signature));
    }
}
