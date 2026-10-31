using System.Net;
using System.Text.RegularExpressions;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Helpers;

/// <summary>
/// Pure helpers for links shared into FloTr from Instagram/Facebook (PWA share target):
/// host allow-listing (the preview fetch must never become an open proxy / SSRF vector)
/// and Open Graph parsing of the fetched HTML.
/// </summary>
public static partial class SocialLinkHelper
{
    private static readonly string[] InstagramHosts = ["instagram.com"];
    private static readonly string[] FacebookHosts = ["facebook.com", "fb.watch", "fb.me", "fb.com"];

    /// <summary>Returns "instagram" / "facebook" for an allowed https URL, otherwise null.</summary>
    public static string? GetSource(Uri? uri)
    {
        if (uri == null || !uri.IsAbsoluteUri || uri.Scheme != Uri.UriSchemeHttps) return null;
        if (!uri.IsDefaultPort) return null;

        var host = uri.Host.ToLowerInvariant();
        if (InstagramHosts.Any(h => host == h || host.EndsWith("." + h))) return "instagram";
        if (FacebookHosts.Any(h => host == h || host.EndsWith("." + h))) return "facebook";
        return null;
    }

    public static string? GetSource(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) ? GetSource(uri) : null;

    /// <summary>
    /// Parses og:title / og:description / og:image from HTML. Returns null when the page
    /// carries nothing usable (typically Meta's login wall).
    /// </summary>
    public static LinkPreviewDto? ParseOpenGraph(string html, string url, string source)
    {
        var meta = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (Match tag in MetaTagRegex().Matches(html))
        {
            string? key = null, content = null;
            foreach (Match attr in AttributeRegex().Matches(tag.Value))
            {
                var name = attr.Groups["name"].Value.ToLowerInvariant();
                var value = attr.Groups["dq"].Success ? attr.Groups["dq"].Value : attr.Groups["sq"].Value;
                if (name is "property" or "name") key = value;
                else if (name == "content") content = value;
            }
            if (key != null && content != null && !meta.ContainsKey(key))
                meta[key] = Clean(content);
        }

        meta.TryGetValue("og:title", out var title);
        meta.TryGetValue("og:description", out var description);
        if (string.IsNullOrEmpty(description)) meta.TryGetValue("description", out description);
        meta.TryGetValue("og:image", out var image);

        if (IsLoginWall(title) && string.IsNullOrEmpty(description)) return null;
        if (string.IsNullOrEmpty(title) && string.IsNullOrEmpty(description)) return null;

        return new LinkPreviewDto
        {
            Url = url,
            Source = source,
            Title = Truncate(title, 300),
            Description = Truncate(description, 4000),
            Caption = Truncate(ExtractCaption(description) ?? ExtractCaption(title), 4000),
            ImageUrl = Uri.TryCreate(image, UriKind.Absolute, out var imageUri) && imageUri.Scheme == Uri.UriSchemeHttps
                ? image
                : null,
        };
    }

    /// <summary>
    /// Instagram wraps the caption: `12 likes, 3 comments - user on May 1, 2026: "caption".`
    /// (og:description) or `User on Instagram: "caption"` (og:title). Returns the inner text.
    /// </summary>
    public static string? ExtractCaption(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var match = QuotedCaptionRegex().Match(text);
        if (!match.Success) return null;
        var caption = match.Groups["caption"].Value.Trim();
        return caption.Length > 0 ? caption : null;
    }

    private static bool IsLoginWall(string? title) =>
        string.IsNullOrWhiteSpace(title)
        || LoginWallTitleRegex().IsMatch(title.Trim());

    private static string Clean(string value) =>
        WebUtility.HtmlDecode(value).Replace("\r\n", "\n").Trim();

    private static string? Truncate(string? value, int max) =>
        string.IsNullOrEmpty(value) ? null : value.Length <= max ? value : value[..max].TrimEnd() + "…";

    [GeneratedRegex(@"<meta\b[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex MetaTagRegex();

    [GeneratedRegex(@"(?<name>[a-zA-Z:-]+)\s*=\s*(?:""(?<dq>[^""]*)""|'(?<sq>[^']*)')")]
    private static partial Regex AttributeRegex();

    // Greedy up to the LAST quote so quotes inside the caption survive.
    [GeneratedRegex(@":\s*[""“](?<caption>.*)[""”]\s*\.?\s*$", RegexOptions.Singleline)]
    private static partial Regex QuotedCaptionRegex();

    [GeneratedRegex(@"^(instagram|facebook|(log ?in|přihlásit|přihlášení)\b.*)$", RegexOptions.IgnoreCase)]
    private static partial Regex LoginWallTitleRegex();
}
