using Microsoft.EntityFrameworkCore;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Dtos;
using TrainingDataAccess.Extensions;
//using TrainingDataAccess.Migrations;
using TrainingDataAccess.Models;
using TrainingDataAccess.Models.Factories;
using TrainingGroup = TrainingDataAccess.Models.TrainingGroup;

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
            try
            {

                context.Add(training);

                foreach (var activity in training.TrainingParts.SelectMany(tp => tp.TrainingGroups)
                             .SelectMany(g => g.TrainingGroupActivities).Select(a => a.Activity))
                {
                    context.Entry(activity).State = EntityState.Unchanged;
                }

                await context.SaveChangesAsync();

            }
            catch (Exception ex)
            {
                throw new Exception("Ukládání změn do databáze se nepodařilo:" + ex.Message + " - " + ex.InnerException?.Message, ex);
            }

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

        public async Task<List<TrainingDto>> GetTrainingsAll(string searchString)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var words = searchString.Split(' ');

            return await context.Trainings
                .AsQueryable()
                .AsNoTracking()
                .Where(Training.Contains(words))
                .MapTrainingToDto()
                .ToListAsync();

        }

        public async Task SaveTraining(TrainingDto trainingDto)
        {
            var training = _trainingFactory.Build(trainingDto);

            if (training.TrainingId == 0)
            {
                await CreateTraining(training);
            }
            else
            {
                await UpdateTraining(training);
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
                    .ThenInclude(tp => tp.TrainingGroups)
                    .ThenInclude(tg => tg.TrainingGroupActivities)
                    .SingleOrDefault();

                if (existingTraining == null)
                {
                    return;
                }
                context.Entry(existingTraining).State = EntityState.Modified;

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

                        SaveTrainingGroups(context, existingTrainingPart, trainingPart.TrainingGroups);

                    }
                    else
                    {
                        // Insert child
                        var newChild = new TrainingPart(training);

                        newChild.Initialize(trainingPart.TrainingPartId, trainingPart.Name, trainingPart.Description,
                            trainingPart.Duration, trainingPart.Order);


                        SaveTrainingGroups(context, newChild, trainingPart.TrainingGroups);

                        existingTraining.AddTrainingPart(newChild);
                    }
                }
            }
        }

        private static void SaveTrainingGroups(TrainingDbContext context, TrainingPart trainingPart, List<TrainingGroup> trainingGroups)
        {
            //// Delete children
            var trainingGroupsForRemoval = trainingPart.TrainingGroups.Where(i => trainingGroups.All(j => j.TrainingGroupId != i.TrainingGroupId)).ToList();

            foreach (var trainingGroup in trainingGroupsForRemoval)
            {
                trainingPart.TrainingGroups?.Remove(trainingGroup);
                context.Entry(trainingGroup).State = EntityState.Deleted;
                context.Entry(trainingPart).State = EntityState.Modified;
            }

            if (!trainingGroups.Any()) return;


            // Update and Insert children
            foreach (var trainingGroup in trainingGroups)
            {
                if (trainingPart.TrainingGroups == null)
                {
                    // Insert child
                    AddTrainingGroup(context, trainingPart, trainingGroup);
                    continue;
                }

                var existingTrainingGroups = trainingPart.TrainingGroups.Where(c => c.TrainingGroupId == trainingGroup.TrainingGroupId
                    && trainingGroup.TrainingGroupId != default
                    ).ToList();


                if (existingTrainingGroups.Any())
                {
                    foreach (var existingTrainingGroup in existingTrainingGroups)
                    {
                        // Update child
                        context.Entry(existingTrainingGroup).CurrentValues.SetValues(trainingGroup);
                        context.Entry(existingTrainingGroup).State = EntityState.Modified;

                        SaveTrainingActivities(context, existingTrainingGroup, trainingGroup.TrainingGroupActivities);
                    }

                    continue;
                }

                AddTrainingGroup(context, trainingPart, trainingGroup);

            }

        }

        private static void AddTrainingGroup(TrainingDbContext context, TrainingPart trainingPart,
            TrainingGroup trainingGroup)
        {
            trainingPart.AddTrainingGroup(trainingGroup);


        }

        private static void SaveTrainingActivities(TrainingDbContext context, TrainingGroup trainingGroup, List<TrainingGroupActivity> trainingGroupActivities)
        {
            //// Delete children
            var trainingActivitiesForRemoval = trainingGroup.TrainingGroupActivities.Where(i => trainingGroupActivities.All(j => j.TrainingGroupActivityId != i.TrainingGroupActivityId)).ToList();

            foreach (var trainingActivity in trainingActivitiesForRemoval)
            {
                trainingGroup.TrainingGroupActivities?.Remove(trainingActivity);
                context.Entry(trainingGroup).State = EntityState.Modified;
                context.Entry(trainingActivity).State = EntityState.Deleted;
            }

            if (!trainingGroupActivities.Any()) return;


            if (trainingGroup.TrainingGroupActivities != null && trainingGroup.TrainingGroupActivities.Any() && trainingGroupActivities.Any())
            {
                // Update and Insert children
                foreach (var activity in trainingGroupActivities)
                {
                    var existingTrainingActivities = trainingGroup.TrainingGroupActivities?.Where(c => c.TrainingGroupActivityId == activity.TrainingGroupActivityId && c.TrainingGroupActivityId != default);

                    if (existingTrainingActivities != null && existingTrainingActivities.Any())
                    {
                        continue;
                    }

                    AddActivity(context, trainingGroup, activity);
                }
            }
            else
            {
                foreach (var activity in trainingGroupActivities)
                {

                    AddActivity(context, trainingGroup, activity);
                }
            }
        }

        private static void AddActivity(TrainingDbContext context, TrainingGroup trainingGroup, TrainingGroupActivity activity)
        {
            context.Entry(trainingGroup).State = EntityState.Modified;
            trainingGroup.TrainingGroupActivities.Add(activity);
            context.Entry(activity).State = EntityState.Added;
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