using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TrainingGenerator.DbContexts;
using TrainingGenerator.Dtos;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.ActivityProviders
{
    public class DatabaseActivityProvider : IActivityProvider
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseActivityProvider(TrainingDbContextFactory trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task<IEnumerable<Activity>> GetAllActivities()
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                IEnumerable<ActivityDTO> activitiesDTOs = await context.Activities.ToListAsync();

                return activitiesDTOs.Select(r => ToActivity(r));
            }
        }

        private static Activity ToActivity(ActivityDTO dto)
        {
            return new Activity(dto.Name, dto.Description, dto.Rating, dto.Duration, dto.PersonsMin, dto.PersonsMax);
        }
    }
}