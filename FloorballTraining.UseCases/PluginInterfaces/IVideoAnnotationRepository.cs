using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IVideoAnnotationRepository
{
    Task<VideoAnnotation?> GetByVideoIdAsync(int videoId);

    /// <summary>Creates or updates the one annotation row for this video.</summary>
    Task<VideoAnnotation> UpsertAsync(int videoId, int? trimStartMs, int? trimEndMs, string dataJson, string? userId);
}
