using Microsoft.EntityFrameworkCore;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.ActivityServices
{
    public class DatabaseActivityService : IActivityService
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseActivityService(TrainingDbContextFactory trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task<Activity> CreateActivity(Activity activity)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            context.Add(activity);

            await context.SaveChangesAsync();

            return activity;
        }

        public async Task<List<Activity>> GetAllActivities()
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            return await context.Activities.Include(t => t.Tags).ToListAsync();

        }

        public async Task<Activity> GetActivity(int id)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            return await context.Activities.Include(a => a.Tags).SingleAsync(a => a.ActivityId == id);
        }

        public async Task UpdateActivity(Activity activity1)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();

            var existingActivity = context.Activities
                .Where(p => p.ActivityId == activity1.ActivityId)
                .Include(p => p.Tags)
                .SingleOrDefault();

            if (existingActivity == null)
            {
                return;
            }

            try
            {

                context.Entry(existingActivity).CurrentValues.SetValues(activity1);

                // Delete children
                foreach (var existingTag in existingActivity.Tags.ToList())
                {
                    var tag = activity1.Tags.SingleOrDefault(i => i.TagId == existingTag.TagId);
                    if (tag == null)
                        existingActivity.Tags.Remove(existingTag);
                }

                // Update and Insert children
                foreach (var tag in activity1.Tags)
                {
                    var existingTags = existingActivity.Tags
                        .SingleOrDefault(c => c.TagId == tag.TagId && c.TagId != default);

                    if (existingTags != null)
                        // Update child
                        context.Entry(existingTags).CurrentValues.SetValues(tag);
                    else
                    {
                        // Insert child
                        var newChild = new Tag(tag);
                        existingActivity.Tags.Add(newChild);
                    }
                }

                await context.SaveChangesAsync();
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task DeleteActivity(Activity activity)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            context.Remove(activity);

            await context.SaveChangesAsync();
        }
    }
}