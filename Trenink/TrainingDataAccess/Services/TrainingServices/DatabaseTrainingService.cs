using Microsoft.EntityFrameworkCore;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.TrainingServices
{
    public class DatabaseTrainingService : ITrainingService
    {
        private readonly IDbContextFactory<TrainingDbContext> _trainingDbContextFactory;

        public DatabaseTrainingService(IDbContextFactory<TrainingDbContext> trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task<Training> CreateTraining(Training training)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            context.Add(training);
            await context.SaveChangesAsync();
            return training;
        }

        public async Task<long> GetTrainingsCount()
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Trainings.CountAsync();
        }


        public async Task<List<Training>> GetAllTrainings()
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Trainings.Include(t => t.TrainingParts).ThenInclude(tp => tp.Activities).ToListAsync();

        }

        public async Task<Training> GetTraining(int id)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Trainings.Include(a => a.TrainingParts).ThenInclude(tp => tp.Activities).SingleAsync(a => a.TrainingId == id);
        }

        public async Task UpdateTraining(Training training)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            try
            {

                var existingTraining = context.Trainings
                    .Where(p => p.TrainingId == training.TrainingId)
                    .Include(p => p.TrainingParts)
                    .SingleOrDefault();

                if (existingTraining == null)
                {
                    return;
                }

                context.Entry(existingTraining).CurrentValues.SetValues(training);

                // Delete children


                var trainingPartsForRemoval = (from existingTrainingPart in existingTraining.TrainingParts
                                               let trainingPart = training.TrainingParts.SingleOrDefault(i => i.TrainingPartId == existingTrainingPart.TrainingPartId)
                                               where trainingPart == null
                                               select existingTrainingPart).ToList();

                foreach (var trainingPart in trainingPartsForRemoval)
                {
                    existingTraining.TrainingParts.Remove(trainingPart);
                }



                if (training.TrainingParts.Any())
                {
                    // Update and Insert children
                    foreach (var trainingPart in training.TrainingParts)
                    {
                        if (existingTraining.TrainingParts != null)
                        {
                            var existingTrainingParts = existingTraining.TrainingParts
                                .SingleOrDefault(c => c.TrainingPartId == trainingPart.TrainingPartId && c.TrainingPartId != default);

                            if (existingTrainingParts != null)
                                // Update child
                                context.Entry(existingTrainingParts).CurrentValues.SetValues(trainingPart);
                            else
                            {
                                // Insert child

                                var newChild = new TrainingPart()
                                {
                                    TrainingPartId = trainingPart.TrainingPartId,
                                    Name = trainingPart.Name,
                                    Trainings = new List<Training>(trainingPart.Trainings),
                                    Description = trainingPart.Description
                                };


                                existingTraining.TrainingParts.Add(newChild);
                            }
                        }
                    }
                }
                await context.SaveChangesAsync();

            }
            catch (Exception x)
            {
                throw new Exception("Ukládání změn do databáze se nepodařilo", x);
            }
        }



        public async Task DeleteTraining(Training training
        )
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();

            var existingTraining = context.Trainings
                .SingleOrDefault(p => p.TrainingId == training.TrainingId);

            if (existingTraining == null)
            {
                return;
            }

            context.Remove(existingTraining);

            await context.SaveChangesAsync();
        }
    }
}