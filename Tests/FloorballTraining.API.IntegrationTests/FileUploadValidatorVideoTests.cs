using FloorballTraining.API.Helpers;
using Microsoft.AspNetCore.Http;

namespace FloorballTraining.API.IntegrationTests;

// #127: FileUploadValidator extended with offset-aware signatures so it can check mp4's
// "ftyp" box (offset 4, preceded by a variable-length size field) alongside offset-0 formats.
public class FileUploadValidatorVideoTests
{
    private static readonly IReadOnlySet<string> VideoExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".mp4", ".webm" };
    private static readonly IReadOnlySet<string> VideoContentTypes = new HashSet<string> { "video/mp4", "video/webm" };

    private static readonly IReadOnlyList<(int Offset, byte[] Signature)> VideoSignatures =
    [
        (4, "ftyp"u8.ToArray()),
        (0, new byte[] { 0x1A, 0x45, 0xDF, 0xA3 }),
    ];

    private static IFormFile MakeFile(byte[] content, string fileName, string contentType)
        => new FormFile(new MemoryStream(content), 0, content.Length, "file", fileName) { Headers = new HeaderDictionary(), ContentType = contentType };

    [Fact]
    public void Accepts_mp4_with_ftyp_box_at_offset_4()
    {
        byte[] mp4 = [0x00, 0x00, 0x00, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p', 0x69, 0x73, 0x6F, 0x6D];
        var file = MakeFile(mp4, "clip.mp4", "video/mp4");

        FileUploadValidator.Validate(file, 1_000_000, VideoExtensions, VideoContentTypes, VideoSignatures)
            .Should().Be(FileValidationResult.Valid);
    }

    [Fact]
    public void Accepts_webm_with_EBML_header_at_offset_0()
    {
        byte[] webm = [0x1A, 0x45, 0xDF, 0xA3, 0x01, 0x02, 0x03, 0x04];
        var file = MakeFile(webm, "clip.webm", "video/webm");

        FileUploadValidator.Validate(file, 1_000_000, VideoExtensions, VideoContentTypes, VideoSignatures)
            .Should().Be(FileValidationResult.Valid);
    }

    [Fact]
    public void Rejects_a_renamed_file_whose_bytes_dont_match_either_signature()
    {
        // A jpeg renamed to .mp4 — extension and content-type can be spoofed, magic bytes can't.
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];
        var file = MakeFile(jpeg, "clip.mp4", "video/mp4");

        FileUploadValidator.Validate(file, 1_000_000, VideoExtensions, VideoContentTypes, VideoSignatures)
            .Should().Be(FileValidationResult.UnsupportedType);
    }

    [Fact]
    public void Rejects_disallowed_extension()
    {
        byte[] mp4 = [0x00, 0x00, 0x00, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p'];
        var file = MakeFile(mp4, "clip.avi", "video/mp4");

        FileUploadValidator.Validate(file, 1_000_000, VideoExtensions, VideoContentTypes, VideoSignatures)
            .Should().Be(FileValidationResult.UnsupportedType);
    }

    [Fact]
    public void Rejects_file_larger_than_max_bytes()
    {
        byte[] mp4 = [0x00, 0x00, 0x00, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p'];
        var file = MakeFile(mp4, "clip.mp4", "video/mp4");

        FileUploadValidator.Validate(file, maxBytes: 4, VideoExtensions, VideoContentTypes, VideoSignatures)
            .Should().Be(FileValidationResult.TooLarge);
    }

    [Fact]
    public void Rejects_empty_file()
    {
        var file = MakeFile([], "clip.mp4", "video/mp4");

        FileUploadValidator.Validate(file, 1_000_000, VideoExtensions, VideoContentTypes, VideoSignatures)
            .Should().Be(FileValidationResult.Empty);
    }

    [Fact]
    public void Existing_offset_0_only_overload_still_works_unchanged()
    {
        byte[] xlsx = [0x50, 0x4B, 0x03, 0x04];
        var file = MakeFile(xlsx, "report.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        var extensions = new HashSet<string> { ".xlsx" };
        var contentTypes = new HashSet<string> { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
        var signatures = new[] { new byte[] { 0x50, 0x4B, 0x03, 0x04 } };

        FileUploadValidator.Validate(file, 1_000_000, extensions, contentTypes, signatures)
            .Should().Be(FileValidationResult.Valid);
    }
}
