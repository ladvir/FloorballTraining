using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class VideoAnnotationEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : IVideoAnnotationRepository
{
    public async Task<VideoAnnotation?> GetByIdAsync(int id)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        return await db.VideoAnnotations.FindAsync(id);
    }

    public async Task<VideoAnnotation?> GetByVideoIdAsync(int videoId)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        return await db.VideoAnnotations.FirstOrDefaultAsync(a => a.VideoId == videoId);
    }

    public async Task<VideoAnnotation> UpsertAsync(int videoId, int? trimStartMs, int? trimEndMs, string dataJson, string? userId)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var existing = await db.VideoAnnotations.FirstOrDefaultAsync(a => a.VideoId == videoId);
        if (existing == null)
        {
            existing = new VideoAnnotation { VideoId = videoId, CreatedByUserId = userId, CreatedAt = DateTime.UtcNow };
            db.VideoAnnotations.Add(existing);
        }

        existing.TrimStartMs = trimStartMs;
        existing.TrimEndMs = trimEndMs;
        existing.DataJson = dataJson;
        existing.UpdatedByUserId = userId;
        existing.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task SetExportStatusAsync(int id, VideoExportStatus status, int? exportedVideoId, string? error)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var existing = await db.VideoAnnotations.FindAsync(id);
        if (existing == null) return;

        existing.ExportStatus = status;
        existing.ExportedVideoId = exportedVideoId;
        existing.ExportError = error;
        await db.SaveChangesAsync();
    }
}
