using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TrainingGenerator.DbContexts;

using TrainingGenerator.Dtos;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.AcitivityDeletors
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
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                context.Add(activity);

                await context.SaveChangesAsync();

                return activity;
            }
        }

        public async Task<IEnumerable<Activity>> GetAllActivities()
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                return await context.Activities.ToListAsync();
            }
        }

        public async Task<Activity> GetActivity(int id)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                return await context.Activities.SingleAsync(a => a.ActivityId == id);
            }
        }

        public async Task UpdateActivity(Activity activity)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                context.Entry(activity).State = activity.ActivityId == 0 ?
                        EntityState.Added :
                        EntityState.Modified;

                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteActivity(Activity activity)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                context.Remove(activity);

                await context.SaveChangesAsync();
            }
        }
    }
}