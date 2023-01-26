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
            context.Attach(activity);
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

        public async Task UpdateActivity(Activity activity)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();

            try
            {

                var existingActivity = context.Activities
                    .Where(p => p.ActivityId == activity.ActivityId)
                    .Include(p => p.Tags)
                    .SingleOrDefault();

                if (existingActivity == null)
                {
                    return;
                }

                context.Entry(existingActivity).CurrentValues.SetValues(activity);

                // Delete children

                if (activity.Tags != null)
                {
                    var tagsForRemoval = (from existingTag in existingActivity.Tags let tag = activity.Tags?.SingleOrDefault(i => i.TagId == existingTag.TagId) where tag == null select existingTag).ToList();

                    foreach (var tag in tagsForRemoval)
                    {
                        existingActivity.Tags?.Remove(tag);
                    }

                }

                if (activity.Tags != null && activity.Tags.Any())
                {
                    // Update and Insert children
                    foreach (var tag in activity.Tags)
                    {
                        if (existingActivity.Tags != null)
                        {
                            var existingTags = existingActivity.Tags
                                .SingleOrDefault(c => c.TagId == tag.TagId && c.TagId != default);

                            if (existingTags != null)
                                // Update child
                                context.Entry(existingTags).CurrentValues.SetValues(tag);
                            else
                            {
                                // Insert child
                                var newChild = new Tag
                                {
                                    TagId = tag.TagId,
                                    Name = tag.Name,
                                    Color = tag.Color,
                                    ParentTagId = tag.ParentTagId
                                };


                                if (tag.Activities != null)
                                    newChild.Activities = new List<Activity>(tag.Activities);

                                existingActivity.Tags.Add(newChild);
                            }
                        }
                    }



                    await context.SaveChangesAsync();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }



        public async Task DeleteActivity(Activity activity)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();

            var existingActivity = context.Activities
                .Where(p => p.ActivityId == activity.ActivityId)
                .Include(p => p.Tags)
                .SingleOrDefault();

            if (existingActivity == null)
            {
                return;
            }

            context.Remove(existingActivity);

            await context.SaveChangesAsync();
        }
    }
}