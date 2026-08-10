using FloorballTraining.CoreBusiness;
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

    public async Task DeleteAsync(Video video)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        db.Videos.Attach(video);
        db.Videos.Remove(video);
        await db.SaveChangesAsync();
    }
}
