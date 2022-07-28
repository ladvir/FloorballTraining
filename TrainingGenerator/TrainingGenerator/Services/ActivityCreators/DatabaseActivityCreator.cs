using System;
using System.Threading.Tasks;
using TrainingGenerator.DbContexts;
using TrainingGenerator.Dtos;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.ActivityCreators
{
    public class DatabaseActivityCreator : IActivityCreator
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseActivityCreator(TrainingDbContextFactory trainingDbContextFactory)
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
    }
}