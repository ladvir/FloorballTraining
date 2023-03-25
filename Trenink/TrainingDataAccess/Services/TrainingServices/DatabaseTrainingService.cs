using Microsoft.EntityFrameworkCore;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Dtos;
using TrainingDataAccess.Extensions;
using TrainingDataAccess.Models;
using TrainingDataAccess.Models.Factories;

namespace TrainingDataAccess.Services.TrainingServices
{
    public class DatabaseTrainingService : ITrainingService
    {
        private readonly IDbContextFactory<TrainingDbContext> _trainingDbContextFactory;

        private readonly ITrainingFactory _trainingFactory;

        public DatabaseTrainingService(IDbContextFactory<TrainingDbContext> trainingDbContextFactory, ITrainingFactory trainingFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
            _trainingFactory = trainingFactory;
        }

        public async Task<Training> CreateTraining(Training training)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            context.ChangeTracker.Clear();

            context.Add(training);
            await context.SaveChangesAsync();
            return training;
        }

        public async Task<DataResult<TrainingDto>> GetTrainings(PaginationDTO pagination, string searchString)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var words = searchString.Split(' ');

            var queryable = context.Trainings.AsQueryable().AsNoTracking()

                    .OrderBy(o => o.TrainingId)
                    .Where(Training.Contains(words)
                    );

            var result = new DataResult<TrainingDto>
            {
                Items = await queryable.Paginate(pagination).MapTrainingToDto().ToListAsync(),
                Count = await queryable.CountAsync()
            };

            return result;
        }

        public async Task SaveTraining(TrainingDto trainingDto)
        {
            var training = _trainingFactory.Build(trainingDto);

            if (training.TrainingId == 0)
            {
                await CreateTraining(training);
            }

            await UpdateTraining2(training);
        }

        public async Task UpdateTraining2(Training training)
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

                SaveTrainingParts(training, context, existingTraining);


                await context.SaveChangesAsync();

            }
            catch (Exception x)
            {
                throw new Exception("Ukládání změn do databáze se nepodařilo", x);
            }
        }

        private static void SaveTrainingParts(Training training, TrainingDbContext context, Training existingTraining)
        {
            context.Entry(existingTraining).State = EntityState.Modified;
            //// Delete children
            var trainingPartsForRemoval = (from existingTrainingPart in existingTraining.TrainingParts
                                           let tag = training.TrainingParts?.SingleOrDefault(i => i.TrainingPartId == existingTrainingPart.TrainingPartId)
                                           where tag == null
                                           select existingTrainingPart).ToList();

            foreach (var trainingPart in trainingPartsForRemoval)
            {
                existingTraining.TrainingParts?.Remove(trainingPart);
                context.Entry(trainingPart).State = EntityState.Deleted;
            }

            if (training.TrainingParts.Any())
            {
                // Update and Insert children
                foreach (var trainingPart in training.TrainingParts)
                {
                    if (existingTraining.TrainingParts == null) continue;

                    var existingTrainingPart = existingTraining.TrainingParts
                        .SingleOrDefault(c => c.TrainingPartId == trainingPart.TrainingPartId && c.TrainingPartId != default);

                    if (existingTrainingPart != null)
                    {
                        // Update child
                        context.Entry(existingTrainingPart).CurrentValues.SetValues(trainingPart);
                        context.Entry(existingTrainingPart).State = EntityState.Modified;
                    }
                    else
                    {
                        // Insert child
                        var newChild = new TrainingPart(training);

                        newChild.Initialize(trainingPart.TrainingPartId, trainingPart.Name, trainingPart.Description,
                            trainingPart.Duration, trainingPart.Order);

                        existingTraining.AddTrainingPart(newChild);
                    }
                }
            }
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

                context.Attach(existingTraining);
                context.Entry(existingTraining).CurrentValues.SetValues(training);
                context.Entry(existingTraining).State = EntityState.Modified;
                // Delete children
                var trainingPartsForRemoval = (from existingTrainingPart in existingTraining.TrainingParts
                                               let tag = training.TrainingParts?.SingleOrDefault(i => i.TrainingPartId == existingTrainingPart.TrainingPartId)
                                               where tag == null
                                               select existingTrainingPart).ToList();

                foreach (var trainingPart in trainingPartsForRemoval)
                {
                    existingTraining.TrainingParts?.Remove(trainingPart);
                }

                if (training.TrainingParts.Any())
                {
                    // Update and Insert children
                    foreach (var trainingPart in training.TrainingParts)
                    {
                        if (existingTraining.TrainingParts == null) continue;

                        var existingTrainingParts = existingTraining.TrainingParts
                            .SingleOrDefault(c => c.TrainingPartId == trainingPart.TrainingPartId && c.TrainingPartId != default);

                        if (existingTrainingParts != null)
                        {

                            // Update child
                            context.TrainingParts.Attach(existingTrainingParts);
                            context.Entry(existingTrainingParts).CurrentValues.SetValues(trainingPart);
                            context.Entry(existingTrainingParts).State = EntityState.Modified;
                        }
                        else
                        {
                            // Insert child
                            var newChild = new TrainingPart(training);

                            newChild.Initialize(trainingPart.TrainingPartId, trainingPart.Name, trainingPart.Description, trainingPart.Duration, trainingPart.Order);

                            existingTraining.AddTrainingPart(newChild);

                            context.TrainingParts.Attach(newChild);
                            context.Entry(newChild).State = EntityState.Added;


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


        public async Task DeleteTraining(TrainingDto training)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var existingTraining = context.Trainings
                .Where(t => t.TrainingId == training.TrainingId)
                .Include(p => p.TrainingParts)
                .SingleOrDefault();

            if (existingTraining == null)
            {
                return;
            }

            context.Remove(existingTraining);

            await context.SaveChangesAsync();
        }

        public async Task<TrainingDto> GetTraining(int trainingId)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var training = await context.Trainings
                .Include(t => t.TrainingParts)
                .ThenInclude(tp => tp.TrainingGroups)
                .ThenInclude(tga => tga.TrainingGroupActivities)
                .ThenInclude(a => a.Activity)
                .MapTrainingToDto().SingleAsync(a => a.TrainingId == trainingId);


            return training;
        }




    }
}