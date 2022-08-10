using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using TrainingGenerator.DbContexts;
using TrainingGenerator.Dtos;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.ActivityUpdators
{
    public class DatabaseActivityUpdator : IActivityUpdator
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseActivityUpdator(TrainingDbContextFactory trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task UpdateActivity(Activity activity)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                ActivityDTO activityDTO = ToActivityDTO(activity);

                context.Entry(activityDTO).State = activityDTO.Id == 0 ?
                        EntityState.Added :
                        EntityState.Modified;

                await context.SaveChangesAsync();
            }
        }

        private static ActivityDTO ToActivityDTO(Activity activity)
        {
            return new ActivityDTO
            {
                Id = activity.Id,
                Name = activity.Name,
                Description = activity.Description,
                Duration = activity.Duration,
                PersonsMin = activity.PersonsMin,
                PersonsMax = activity.PersonsMax,
                Rating = activity.Rating
            };
        }
    }
}