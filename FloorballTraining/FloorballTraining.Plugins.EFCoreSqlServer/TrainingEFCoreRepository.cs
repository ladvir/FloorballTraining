using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TrainingEFCoreRepository : GenericEFCoreRepository<Training>, ITrainingRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public TrainingEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }
        public async Task AddTrainingAsync(Training training)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var newTraining = training.Clone();

            newTraining.TrainingGoal = null;
            newTraining.TrainingGoalId = training.TrainingGoal!.Id;

            newTraining.Place = null;
            newTraining.PlaceId = training.Place!.Id;

            foreach (var ageGroup in newTraining.TrainingAgeGroups)
            {
                ageGroup.AgeGroup = null;
            }

            foreach (var group in newTraining.TrainingParts!.SelectMany(tp => tp.TrainingGroups))
            {
                group.Activity = null;
            }


            db.Trainings.Add(newTraining);

            await db.SaveChangesAsync();
        }

        public async Task<List<string?>> GetEquipmentByTrainingIdAsync(int trainingId)
        {
            var training = await GetTrainingByIdAsync(trainingId);

            if (training == null) return new List<string?>();

            if (training.TrainingParts == null) return new List<string?>();

            return training.TrainingParts.SelectMany(tp => tp.TrainingGroups)
            .Select(tg => tg.Activity).AsEnumerable()
            .SelectMany(a => a!.ActivityEquipments).Select(t => t.Equipment?.Name).ToList();
        }

        public async Task<Training?> GetTrainingByIdAsync(int trainingId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Trainings
                .Include(t => t.Place)
                .Include(t => t.TrainingAgeGroups)
                .ThenInclude(tag => tag.AgeGroup)
                .Include(t => t.TrainingGoal)
                .Include(t => t.TrainingParts)!
                .ThenInclude(tp => tp.TrainingGroups)
                .ThenInclude(tg => tg.Activity)
                .ThenInclude(tag => tag!.ActivityTags)

                .Include(t => t.TrainingParts!)
                .ThenInclude(tp => tp.TrainingGroups)
                .ThenInclude(tg => tg.Activity)
                .ThenInclude(tag => tag!.ActivityEquipments).ThenInclude(ae => ae.Equipment)

                .FirstOrDefaultAsync(a => a.Id == trainingId);
        }


        public async Task UpdateTrainingAsync(Training training)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var existingTraining = await db.Trainings
                .Include(t => t.TrainingAgeGroups).ThenInclude(tag => tag.AgeGroup)
                .Include(t => t.TrainingGoal)
                .Include(t => t.Place)
                .Include(t => t.TrainingParts!)
                .ThenInclude(tp => tp.TrainingGroups)
                .ThenInclude(tg => tg.Activity)
                .FirstAsync(a => a.Id == training.Id);



            training.TrainingGoalId = training.TrainingGoal!.Id;

            training.TrainingGoal = null;

            training.PlaceId = training.Place!.Id;

            SetTrainingGoalAsUnchanged(training, db);

            UpdateTrainingAgeGroups(training, existingTraining);

            UpdateTrainingParts(training, existingTraining, db);



            db.Entry(existingTraining).CurrentValues.SetValues(training);

            await db.SaveChangesAsync(true);
        }

        private static void UpdateTrainingAgeGroups(Training training, Training existingTraining)
        {
            foreach (var trainingAgeGroup in training.TrainingAgeGroups)
            {
                var existingActivityAgeGroup = existingTraining.TrainingAgeGroups
                    .FirstOrDefault(p => p.AgeGroupId == trainingAgeGroup.AgeGroup!.Id);

                if (existingActivityAgeGroup == null)
                {
                    existingTraining.AddAgeGroup(trainingAgeGroup.AgeGroup!);
                }
            }

            foreach (var existingTrainingAgeGroup in existingTraining.TrainingAgeGroups.Where(a => a.Id > 0)
                         .ToList())
            {
                var isExisting = training.TrainingAgeGroups.Any(p => p.AgeGroupId == existingTrainingAgeGroup.AgeGroupId);

                if (!isExisting)
                {
                    existingTraining.TrainingAgeGroups.Remove(existingTrainingAgeGroup);
                }
            }
        }

        private static void UpdateTrainingParts(Training training, Training existingTraining, FloorballTrainingContext db)
        {
            if (training.TrainingParts == null) return;

            foreach (var trainingPart in training.TrainingParts)
            {
                var existingTrainingPart = existingTraining.TrainingParts?
                    .FirstOrDefault(p => p.Id == trainingPart.Id);

                if (existingTrainingPart == null)
                {
                    existingTraining.AddTrainingPart(trainingPart);
                }
                else
                {
                    db.Entry(existingTrainingPart).CurrentValues.SetValues(trainingPart);
                    foreach (var trainingGroup in trainingPart.TrainingGroups)
                    {
                        var existingTrainingGroup =
                            existingTrainingPart?.TrainingGroups.FirstOrDefault(p =>
                                p.Id == trainingGroup.Id);

                        if (existingTrainingGroup == null)
                        {
                            var group = trainingGroup.Clone();

                            group.Activity = null;

                            existingTrainingPart!.TrainingGroups.Add(group);
                        }
                        else
                        {
                            if (trainingGroup.Activity != null)
                            {
                                var existingTrainingGroupActivity = existingTrainingGroup.Activity;

                                if (existingTrainingGroupActivity == null)
                                {

                                    var newActivity = trainingGroup.Activity.Clone();

                                    existingTrainingGroup.Activity = null;

                                    existingTrainingGroup.ActivityId = newActivity.Id;

                                }


                                if (existingTrainingGroup.Id > 0)
                                {
                                    var isExisting = trainingGroup.Activity!.Id == existingTrainingGroupActivity?.Id;

                                    if (!isExisting)
                                    {
                                        //existingTrainingGroup.Activity = null;
                                    }
                                }
                            }
                        }
                    }

                    foreach (var existingTrainingGroup in existingTrainingPart!.TrainingGroups
                                 .Where(a => a.Id > 0)
                                 .ToList())
                    {
                        var isExisting = trainingPart.TrainingGroups.Any(p =>
                            p.Id == existingTrainingGroup.Id);

                        if (!isExisting)
                        {
                            existingTrainingPart.TrainingGroups.Remove(existingTrainingGroup);
                        }
                    }
                }
            }

            if (existingTraining.TrainingParts != null)
                foreach (var existingTrainingPart in existingTraining.TrainingParts.Where(a => a.Id > 0)
                             .ToList())
                {
                    var partsForUpdate =
                        training.TrainingParts.Where(p => p.Id == existingTrainingPart.Id);

                    if (!partsForUpdate.Any())
                    {
                        existingTraining.TrainingParts.Remove(existingTrainingPart);
                    }

                    //foreach (var partForUpdate in partsForUpdate)
                    //{
                    //    existingTrainingPart.Merge(partForUpdate);
                    //}
                }
        }

        private static void SetTrainingAgeGroupsAsUnchanged(Training training, FloorballTrainingContext floorballTrainingContext)
        {
            if (training.TrainingAgeGroups.Any())
            {
                foreach (var ageGroup in training.TrainingAgeGroups)
                {
                    ageGroup.AgeGroup = null;
                    //floorballTrainingContext.Entry(ageGroup.AgeGroup!).State = EntityState.Unchanged;
                }
            }
        }


        private static void SetTrainingGoalAsUnchanged(Training training, FloorballTrainingContext floorballTrainingContext)
        {

            if (training.TrainingGoal != null)
            {
                floorballTrainingContext.Entry(training.TrainingGoal!).State = EntityState.Unchanged;
            }
        }

    }
}