using FloorballTraining.API.Extensions;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Metadata of an Instagram/Facebook post shared into the PWA (share target → "activity
/// from link"). Only allow-listed Meta hosts are fetched, so this is not an open proxy;
/// the per-user AI rate-limit window is reused to keep it from being hammered.
/// </summary>
[Authorize]
[Route("link-preview")]
public class LinkPreviewController(ILinkPreviewService linkPreviewService) : BaseApiController
{
    [HttpGet]
    [EnableRateLimiting(RateLimitingExtensions.AiPolicy)]
    public async Task<ActionResult<LinkPreviewDto>> Get([FromQuery] string url, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(url) || url.Length > 2048)
            return BadRequest(new { code = "invalidUrl" });

        var preview = await linkPreviewService.GetPreviewAsync(url.Trim(), cancellationToken);
        return preview == null ? BadRequest(new { code = "unsupportedUrl" }) : Ok(preview);
    }
}
