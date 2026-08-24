using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class VideoEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : IVideoRepository
{
    public async Task<Video> AddAsync(Video video)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        db.Videos.Add(video);
        await db.SaveChangesAsync();
        return video;
    }

    public async Task<Video?> GetByIdAsync(int id)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        return await db.Videos.FindAsync(id);
    }

    public async Task<List<Video>> GetByOwnerAsync(VideoOwnerType ownerType, int ownerId)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        IQueryable<Video> query = ownerType switch
        {
            VideoOwnerType.Activity => db.Videos.Where(v => v.ActivityId == ownerId),
            VideoOwnerType.Training => db.Videos.Where(v => v.TrainingId == ownerId),
            VideoOwnerType.Appointment => db.Videos.Where(v => v.AppointmentId == ownerId),
            _ => throw new ArgumentOutOfRangeException(nameof(ownerType)),
        };
        return await query.OrderBy(v => v.CreatedAt).ToListAsync();
    }

    public async Task DeleteAsync(Video video)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        // ExportedVideoId is Restrict (not SetNull, see VideoAnnotationConfiguration) - clear any
        // reference to this video before deleting it, or the FK blocks the delete outright.
        await db.VideoAnnotations
            .Where(a => a.ExportedVideoId == video.Id)
            .ExecuteUpdateAsync(a => a.SetProperty(x => x.ExportedVideoId, (int?)null));
        db.Videos.Attach(video);
        db.Videos.Remove(video);
        await db.SaveChangesAsync();
    }
}
