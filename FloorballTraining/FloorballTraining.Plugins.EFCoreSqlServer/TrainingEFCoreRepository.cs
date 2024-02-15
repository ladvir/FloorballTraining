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

            newTraining.TrainingGoal1 = null;
            newTraining.TrainingGoal1Id = training.TrainingGoal1!.Id;

            if (training.TrainingGoal2 != null)
            {
                newTraining.TrainingGoal2 = null;
                newTraining.TrainingGoal2Id = training.TrainingGoal2.Id;
            }

            if (training.TrainingGoal3 != null)
            {
                newTraining.TrainingGoal3 = null;
                newTraining.TrainingGoal3Id = training.TrainingGoal3.Id;
            }

            newTraining.Place = null;
            newTraining.PlaceId = training.Place!.Id;

            foreach (var ageGroup in newTraining.TrainingAgeGroups)
            {
                ageGroup.AgeGroup = null;
            }

            foreach (var group in newTraining.TrainingParts!.Where(tg => tg.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!))
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

            return training.TrainingParts.Where(tg => tg.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!)
            .Select(tg => tg.Activity).AsEnumerable()
            .SelectMany(a => a!.ActivityEquipments).Select(t => t.Equipment?.Name).ToList();
        }

        public async Task DeleteAsync(int id)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var training = await GetTrainingByIdAsync(id);

            if (training != null)
            {

                if (training.TrainingParts != null)
                {
                    var trainingParts = training.TrainingParts.ToList();
                    var trainingGroups = trainingParts.Where(tg => tg.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!).ToList();




                    if (trainingGroups.Any())
                        db.TrainingGroups.RemoveRange(trainingGroups);

                    db.TrainingParts.RemoveRange(trainingParts);
                }

                var trainingAgeGroups = training.TrainingAgeGroups.ToList();
                db.TrainingAgeGroups.RemoveRange(trainingAgeGroups);

                db.Trainings.Remove(training);
                await db.SaveChangesAsync();
            }
        }

        public async Task<Training?> GetTrainingByIdAsync(int trainingId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Trainings
                .Include(t => t.Place)
                .Include(t => t.TrainingAgeGroups)
                .ThenInclude(tag => tag.AgeGroup)
                .Include(t => t.TrainingGoal1)
                .Include(t => t.TrainingGoal2)
                .Include(t => t.TrainingGoal3)
                .Include(t => t.TrainingParts)!
                .ThenInclude(tp => tp.TrainingGroups!)
                .ThenInclude(tg => tg.Activity)
                .ThenInclude(tag => tag!.ActivityTags)

                .Include(t => t.TrainingParts!)
                .ThenInclude(tp => tp.TrainingGroups!)
                .ThenInclude(tg => tg.Activity)
                .ThenInclude(tag => tag!.ActivityEquipments).ThenInclude(ae => ae.Equipment)

                .FirstOrDefaultAsync(a => a.Id == trainingId);
        }


        public async Task UpdateTrainingAsync(Training training)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var existingTraining = await db.Trainings
                .Include(t => t.TrainingAgeGroups).ThenInclude(tag => tag.AgeGroup)
                .Include(t => t.TrainingGoal1)
                .Include(t => t.TrainingGoal2)
                .Include(t => t.TrainingGoal3)
                .Include(t => t.Place)
                .Include(t => t.TrainingParts!)
                .ThenInclude(tp => tp.TrainingGroups!)
                .ThenInclude(tg => tg.Activity)
                .FirstAsync(a => a.Id == training.Id);



            training.TrainingGoal1Id = training.TrainingGoal1?.Id;

            training.TrainingGoal1 = null;

            existingTraining.TrainingGoal1Id = null;
            existingTraining.TrainingGoal2Id = null;
            existingTraining.TrainingGoal3Id = null;

            existingTraining.TrainingGoal1 = null;
            existingTraining.TrainingGoal2 = null;
            existingTraining.TrainingGoal3 = null;



            if (training.TrainingGoal2 != null)
            {
                training.TrainingGoal2Id = training.TrainingGoal2.Id;
                training.TrainingGoal2 = null;

            }

            if (training.TrainingGoal3 != null)
            {
                training.TrainingGoal3Id = training.TrainingGoal3.Id;
                training.TrainingGoal3 = null;
            }


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

                    if (trainingPart.TrainingGroups != null)
                    {
                        foreach (var trainingGroup in trainingPart.TrainingGroups)
                        {
                            var existingTrainingGroup = existingTrainingPart?.TrainingGroups!.FirstOrDefault(p => p.Id == trainingGroup.Id);

                            if (existingTrainingGroup == null)
                            {
                                var group = trainingGroup.Clone();

                                group.Activity = null;

                                existingTrainingPart!.TrainingGroups!.Add(group);
                            }
                            else
                            {
                                if (trainingGroup.ActivityId != null)
                                {
                                    //existingTrainingGroup.Activity = null;
                                    existingTrainingGroup.ActivityId = trainingGroup.ActivityId;
                                }
                                else
                                {
                                    existingTrainingGroup.Activity = null;
                                    existingTrainingGroup.ActivityId = null;
                                }
                            }
                        }

                        foreach (var existingTrainingGroup in existingTrainingPart!.TrainingGroups!
                                     .Where(a => a.Id > 0)
                                     .ToList())
                        {
                            var isExisting = trainingPart.TrainingGroups.Any(p =>
                                p.Id == existingTrainingGroup.Id);

                            if (!isExisting)
                            {
                                existingTrainingPart.TrainingGroups!.Remove(existingTrainingGroup);
                            }
                        }
                    }

                    db.Entry(existingTrainingPart).CurrentValues.SetValues(trainingPart);
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


        private static void SetTrainingGoalAsUnchanged(Training training, FloorballTrainingContext floorballTrainingContext)
        {

            //if (training.TrainingGoal1 != null)
            //{
            //    floorballTrainingContext.Entry(training.TrainingGoal1!).State = EntityState.Unchanged;
            //}

            //if (training.TrainingGoal2 != null)
            //{
            //    floorballTrainingContext.Entry(training.TrainingGoal2!).State = EntityState.Unchanged;
            //}
            //if (training.TrainingGoal3 != null)
            //{
            //    floorballTrainingContext.Entry(training.TrainingGoal3!).State = EntityState.Unchanged;
            //}

        }

    }
}