using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Tests.Videos;

public class VideoLinkClassifierTests
{
    [Theory]
    [InlineData("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ")]
    [InlineData("https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ")]
    public void Recognizes_YouTube_links_and_derives_thumbnail(string url, string expectedId)
    {
        VideoLinkClassifier.TryClassify(url, out var type, out var thumbnailUrl).Should().BeTrue();

        type.Should().Be(VideoType.YouTube);
        thumbnailUrl.Should().Be($"https://img.youtube.com/vi/{expectedId}/hqdefault.jpg");
    }

    [Theory]
    [InlineData("https://www.instagram.com/reel/abc123/")]
    [InlineData("https://instagram.com/p/abc123/")]
    public void Recognizes_Instagram_links_without_thumbnail(string url)
    {
        VideoLinkClassifier.TryClassify(url, out var type, out var thumbnailUrl).Should().BeTrue();

        type.Should().Be(VideoType.Instagram);
        thumbnailUrl.Should().BeNull();
    }

    [Fact]
    public void Falls_back_to_OtherLink_for_unknown_domains()
    {
        VideoLinkClassifier.TryClassify("https://vimeo.com/12345", out var type, out var thumbnailUrl).Should().BeTrue();

        type.Should().Be(VideoType.OtherLink);
        thumbnailUrl.Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not a url")]
    [InlineData("/relative/path")]
    [InlineData("ftp://example.com/video.mp4")]
    public void Rejects_missing_non_absolute_or_non_http_urls(string? url)
        => VideoLinkClassifier.TryClassify(url, out _, out _).Should().BeFalse();
}
