using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.Helpers;

/// <summary>
/// Recognizes YouTube/Instagram links (by domain) vs. any other absolute http(s) URL.
/// For YouTube, also extracts the video id to derive a thumbnail URL (img.youtube.com).
/// </summary>
public static class VideoLinkClassifier
{
    public static bool TryClassify(string? url, out VideoType videoType, out string? thumbnailUrl)
    {
        videoType = VideoType.OtherLink;
        thumbnailUrl = null;

        if (string.IsNullOrWhiteSpace(url)) return false;
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return false;
        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) return false;

        var host = uri.Host.ToLowerInvariant();

        var youTubeId = ExtractYouTubeId(uri, host);
        if (youTubeId != null)
        {
            videoType = VideoType.YouTube;
            thumbnailUrl = $"https://img.youtube.com/vi/{youTubeId}/hqdefault.jpg";
        }
        else if (host == "instagram.com" || host.EndsWith(".instagram.com"))
        {
            videoType = VideoType.Instagram;
        }

        return true;
    }

    private static string? ExtractYouTubeId(Uri uri, string host)
    {
        if (host is "youtu.be" or "www.youtu.be")
        {
            var id = uri.AbsolutePath.Trim('/');
            return id.Length > 0 ? id : null;
        }

        if (host is not ("youtube.com" or "www.youtube.com" or "m.youtube.com"))
            return null;

        if (uri.AbsolutePath == "/watch")
            return GetQueryParam(uri.Query, "v");

        foreach (var prefix in new[] { "/shorts/", "/embed/", "/live/" })
        {
            if (uri.AbsolutePath.StartsWith(prefix, StringComparison.Ordinal))
                return uri.AbsolutePath[prefix.Length..].Split('/')[0];
        }

        return null;
    }

    private static string? GetQueryParam(string query, string key)
    {
        foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var idx = pair.IndexOf('=');
            var k = Uri.UnescapeDataString(idx >= 0 ? pair[..idx] : pair);
            if (k != key) continue;
            return idx >= 0 ? Uri.UnescapeDataString(pair[(idx + 1)..]) : "";
        }
        return null;
    }
}
