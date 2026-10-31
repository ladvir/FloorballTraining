using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Tests.Videos;

public class SocialLinkHelperTests
{
    [Theory]
    [InlineData("https://www.instagram.com/reel/abc123/", "instagram")]
    [InlineData("https://instagram.com/p/abc123/", "instagram")]
    [InlineData("https://www.facebook.com/share/r/1AbC/", "facebook")]
    [InlineData("https://m.facebook.com/watch/?v=1", "facebook")]
    [InlineData("https://fb.watch/xyz/", "facebook")]
    public void Allows_Instagram_and_Facebook_https_links(string url, string expected)
    {
        SocialLinkHelper.GetSource(url).Should().Be(expected);
    }

    [Theory]
    [InlineData("http://www.instagram.com/reel/abc/")] // not https
    [InlineData("https://www.instagram.com:8443/reel/abc/")] // non-default port
    [InlineData("https://evilinstagram.com/reel/abc/")] // look-alike host
    [InlineData("https://instagram.com.evil.example/p/1")]
    [InlineData("https://www.youtube.com/watch?v=1")]
    [InlineData("https://127.0.0.1/")]
    [InlineData("not a url")]
    [InlineData(null)]
    public void Rejects_everything_else(string? url)
    {
        SocialLinkHelper.GetSource(url).Should().BeNull();
    }

    [Fact]
    public void Parses_Instagram_open_graph_and_extracts_caption()
    {
        const string html = """
            <html><head>
            <meta property="og:title" content="Coach Pavel on Instagram: &quot;Passing drill&quot;" />
            <meta content="https://scontent.cdninstagram.com/v/t51/img.jpg" property="og:image" />
            <meta property="og:description" content="1,234 likes, 12 comments - coachpavel on May 3, 2026: &quot;Rychlá přihrávka ve trojici 🏑&#10;3 hráči, 2 branky &quot;nonstop&quot;&quot;. " />
            </head></html>
            """;

        var preview = SocialLinkHelper.ParseOpenGraph(html, "https://www.instagram.com/reel/abc/", "instagram");

        preview.Should().NotBeNull();
        preview!.Title.Should().Be("Coach Pavel on Instagram: \"Passing drill\"");
        preview.ImageUrl.Should().Be("https://scontent.cdninstagram.com/v/t51/img.jpg");
        preview.Caption.Should().Be("Rychlá přihrávka ve trojici 🏑\n3 hráči, 2 branky \"nonstop\"");
        preview.Source.Should().Be("instagram");
    }

    [Fact]
    public void Falls_back_to_title_caption_when_description_has_none()
    {
        const string html = """
            <meta property="og:title" content="Coach on Instagram: &quot;Dribling mezi kužely&quot;">
            <meta name="description" content="See Instagram photos and videos">
            """;

        var preview = SocialLinkHelper.ParseOpenGraph(html, "https://instagram.com/p/1/", "instagram");

        preview!.Caption.Should().Be("Dribling mezi kužely");
    }

    [Theory]
    [InlineData("""<meta property="og:title" content="Instagram">""")]
    [InlineData("""<meta property="og:title" content="Log in or sign up to view">""")]
    [InlineData("<html><head><title>x</title></head></html>")]
    public void Returns_null_for_login_wall_or_empty_page(string html)
    {
        SocialLinkHelper.ParseOpenGraph(html, "https://instagram.com/p/1/", "instagram").Should().BeNull();
    }

    [Fact]
    public void Drops_non_https_image()
    {
        const string html = """
            <meta property="og:title" content="Facebook drill video">
            <meta property="og:image" content="javascript:alert(1)">
            """;

        var preview = SocialLinkHelper.ParseOpenGraph(html, "https://facebook.com/reel/1", "facebook");

        preview!.ImageUrl.Should().BeNull();
        preview.Caption.Should().BeNull();
    }
}
