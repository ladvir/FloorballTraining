using Microsoft.EntityFrameworkCore;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Models;
using TrainingGenerator.Services.AcitivityDeletors;

namespace TrainingDataAccess.Services.AcitivityServices
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

        public async Task<IEnumerable<Activity>> GetAllActivities()
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            return await context.Activities.ToListAsync();

        }

        public async Task<Activity> GetActivity(int id)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            return await context.Activities.SingleAsync(a => a.ActivityId == id);
        }

        public async Task UpdateActivity(Activity activity)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            context.Entry(activity).State = activity.ActivityId == 0 ?
                EntityState.Added :
                EntityState.Modified;

            await context.SaveChangesAsync();
        }

        public async Task DeleteActivity(Activity activity)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();
            context.Remove(activity);

            await context.SaveChangesAsync();
        }
    }
}