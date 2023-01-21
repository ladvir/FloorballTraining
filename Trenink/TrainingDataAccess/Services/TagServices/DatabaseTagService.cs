using Microsoft.EntityFrameworkCore;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.TagServices
{
    public class DatabaseTagService : ITagService
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseTagService(TrainingDbContextFactory trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task<Tag> CreateTag(Tag tag)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            context.Add(tag);
            try
            {
                await context.SaveChangesAsync();
            }
            catch (Exception x)
            {
                throw x;

            }

            return tag;
        }

        public async Task<List<Tag>> GetAllTags()
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            return await context.Tags.ToListAsync();

        }

        public async Task<Tag> GetTag(int id)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            return await context.Tags.SingleAsync(a => a.TagId == id);
        }

        public async Task UpdateTag(Tag tag)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            context.Entry(tag).State = tag.TagId == 0 ?
                EntityState.Added :
                EntityState.Modified;

            await context.SaveChangesAsync();
        }

        public async Task DeleteTag(Tag tag)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            context.Remove(tag);

            await context.SaveChangesAsync();
        }
    }
}