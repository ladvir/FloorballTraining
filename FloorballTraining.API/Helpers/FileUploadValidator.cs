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
        => Validate(file, maxBytes, allowedExtensions, allowedContentTypes,
            allowedSignatures.Select(s => (Offset: 0, Signature: s)).ToList());

    /// <summary>
    /// Same as the offset-0-only overload, but each signature can be anchored at an arbitrary
    /// byte offset — needed for containers like mp4, where the "ftyp" box type sits at offset 4
    /// (preceded by a 4-byte box size that varies per file, so it can't be part of the signature).
    /// </summary>
    public static FileValidationResult Validate(
        IFormFile? file,
        long maxBytes,
        IReadOnlySet<string> allowedExtensions,
        IReadOnlySet<string> allowedContentTypes,
        IReadOnlyList<(int Offset, byte[] Signature)> allowedSignatures)
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

    private static bool HasAllowedSignature(IFormFile file, IReadOnlyList<(int Offset, byte[] Signature)> allowedSignatures)
    {
        if (allowedSignatures.Count == 0)
            return true;

        var maxLength = allowedSignatures.Max(s => s.Offset + s.Signature.Length);
        var header = new byte[maxLength];

        using var stream = file.OpenReadStream();
        var read = stream.Read(header, 0, maxLength);

        return allowedSignatures.Any(s =>
            read >= s.Offset + s.Signature.Length &&
            header.Skip(s.Offset).Take(s.Signature.Length).SequenceEqual(s.Signature));
    }
}
