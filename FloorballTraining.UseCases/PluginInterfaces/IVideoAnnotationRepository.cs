using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IVideoAnnotationRepository
{
    Task<VideoAnnotation?> GetByIdAsync(int id);
    Task<VideoAnnotation?> GetByVideoIdAsync(int videoId);

    /// <summary>Creates or updates the one annotation row for this video.</summary>
    Task<VideoAnnotation> UpsertAsync(int videoId, int? trimStartMs, int? trimEndMs, string dataJson, string? userId);

    /// <summary>Updates the burned-in export state (#141) — set by the export job as it runs.</summary>
    Task SetExportStatusAsync(int id, VideoExportStatus status, int? exportedVideoId, string? error);
}
