using System.Net;
using System.Text;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.API.Services;

public interface ILinkPreviewService
{
    /// <summary>
    /// Fetches Open Graph metadata of an Instagram/Facebook link. Never throws for network
    /// problems — returns a preview with just Url/Source when Meta blocks or times out.
    /// Returns null when the URL is not an allowed Instagram/Facebook https link.
    /// </summary>
    Task<LinkPreviewDto?> GetPreviewAsync(string url, CancellationToken cancellationToken);
}

public class LinkPreviewService(IHttpClientFactory httpClientFactory, ILogger<LinkPreviewService> logger)
    : ILinkPreviewService
{
    public const string HttpClientName = "link-preview";
    private const int MaxRedirects = 5;
    private const int MaxBodyBytes = 1_500_000;

    public async Task<LinkPreviewDto?> GetPreviewAsync(string url, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return null;
        var source = SocialLinkHelper.GetSource(uri);
        if (source == null) return null;

        var fallback = new LinkPreviewDto { Url = uri.ToString(), Source = source };

        try
        {
            var client = httpClientFactory.CreateClient(HttpClientName);

            // Redirects are followed by hand so that every hop is re-checked against the
            // allow-list (fb.me / facebook.com/share/... links redirect).
            var current = uri;
            for (var hop = 0; hop <= MaxRedirects; hop++)
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, current);
                using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

                if (IsRedirect(response.StatusCode) && response.Headers.Location != null)
                {
                    var next = response.Headers.Location.IsAbsoluteUri
                        ? response.Headers.Location
                        : new Uri(current, response.Headers.Location);
                    if (SocialLinkHelper.GetSource(next) == null) return fallback; // e.g. off-site login
                    current = next;
                    continue;
                }

                if (response.StatusCode != HttpStatusCode.OK) return fallback;
                var mediaType = response.Content.Headers.ContentType?.MediaType;
                if (mediaType != null && !mediaType.Contains("html", StringComparison.OrdinalIgnoreCase))
                    return fallback;

                var html = await ReadLimitedAsync(response.Content, cancellationToken);
                var preview = SocialLinkHelper.ParseOpenGraph(html, uri.ToString(), source);
                return preview ?? fallback;
            }

            return fallback;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or OperationCanceledException)
        {
            if (cancellationToken.IsCancellationRequested) throw;
            logger.LogInformation(ex, "Link preview fetch failed for {Host}", uri.Host);
            return fallback;
        }
    }

    private static bool IsRedirect(HttpStatusCode code) =>
        code is HttpStatusCode.MovedPermanently or HttpStatusCode.Found or HttpStatusCode.SeeOther
            or HttpStatusCode.TemporaryRedirect or HttpStatusCode.PermanentRedirect;

    private static async Task<string> ReadLimitedAsync(HttpContent content, CancellationToken cancellationToken)
    {
        await using var stream = await content.ReadAsStreamAsync(cancellationToken);
        var buffer = new byte[MaxBodyBytes];
        var total = 0;
        int read;
        while (total < buffer.Length && (read = await stream.ReadAsync(buffer.AsMemory(total), cancellationToken)) > 0)
            total += read;
        return Encoding.UTF8.GetString(buffer, 0, total);
    }
}
