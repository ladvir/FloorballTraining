using System.Threading.Tasks;
using TrainingGenerator.DbContexts;
using TrainingGenerator.Dtos;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.AcitivityDeletors
{
    public class DatabaseActivityDeletor : IActivityDeletor
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseActivityDeletor(TrainingDbContextFactory trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task CreateActivity(Activity activity)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                ActivityDTO activityDTO = ToActivityDTO(activity);

                context.Add(activityDTO);

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

        public async Task DeleteActivity(Activity activity)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                ActivityDTO activityDTO = ToActivityDTO(activity);

                context.Remove(activityDTO);

                await context.SaveChangesAsync();
            }
        }
    }
}