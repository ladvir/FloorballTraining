using FloorballTraining.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Helpers;

public static class VideoUploadResultExtensions
{
    public static IActionResult ToActionResult(this VideoUploadResult result) => result.Status switch
    {
        VideoUploadStatus.Success => new OkObjectResult(result.Video),
        VideoUploadStatus.Empty => new BadRequestObjectResult("Soubor je prázdný."),
        VideoUploadStatus.TooLarge => new ObjectResult("Video přesahuje maximální povolenou velikost.")
        {
            StatusCode = StatusCodes.Status413PayloadTooLarge
        },
        VideoUploadStatus.UnsupportedType => new BadRequestObjectResult("Nepodporovaný typ souboru. Povolené formáty jsou mp4 a webm."),
        VideoUploadStatus.InvalidUrl => new BadRequestObjectResult("Neplatná URL adresa videa."),
        _ => new BadRequestResult(),
    };
}
