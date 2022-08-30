using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.DbContexts;
using TrainingGenerator.Models;

namespace TrainingGenerator.Services.TrainingServices
{
    public class DatabaseTrainingService : ITrainingService
    {
        private readonly TrainingDbContextFactory _trainingDbContextFactory;

        public DatabaseTrainingService(TrainingDbContextFactory trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task<Training> CreateTraining(Training training)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                foreach (var trainingActivity in training.TrainingActivities)
                {
                    int activityId = trainingActivity.Activity.ActivityId;
                    trainingActivity.Activity = null;
                    trainingActivity.ActivityId = activityId;
                }

                context.Add(training);

                await context.SaveChangesAsync();

                return training;
            }
        }

        public async Task DeleteTraining(Training training)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                context.Remove(training);

                await context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Training>> GetAllTrainings()
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                return await context.Trainings.ToListAsync();
            }
        }

        public async Task<Training> GetTraining(int id)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                return await context.Trainings.SingleAsync(a => a.TrainingId == id);
            }
        }

        public async Task UpdateTraining(Training training)
        {
            using (var context = _trainingDbContextFactory.CreateDbContext())
            {
                context.Entry(training).State = training.TrainingId == 0 ?
                        EntityState.Added :
                        EntityState.Modified;

                await context.SaveChangesAsync();
            }
        }
    }
}