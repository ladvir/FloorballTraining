using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TrainingEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Training>(dbContextFactory), ITrainingRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;

        public async Task AddTrainingAsync(Training training)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            training.TrainingGoal1Id = training.TrainingGoal1!.Id;
            training.TrainingGoal1 = null;

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
            training.Place = null;

            foreach (var ageGroup in training.TrainingAgeGroups)
            {
                ageGroup.AgeGroup = null;
            }

            foreach (var group in training.TrainingParts!.Where(tg => tg.TrainingGroups != null).SelectMany(tp => tp.TrainingGroups!))
            {
                group.Activity = null;
            }

            db.Trainings.Add(training);

            await db.SaveChangesAsync();
        }

        public async Task AddTrainingAsyncOrig(Training training)
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

            var trainingId = await db.SaveChangesAsync();

            training.Id = trainingId;
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

            UpdateTrainingAgeGroups(training, existingTraining);

            UpdateTrainingParts(training, existingTraining, db);


            db.Entry(existingTraining).CurrentValues.SetValues(training);

            await db.SaveChangesAsync(true);
        }

        public async Task<Training> CloneTrainingAsync(int TrainingId)
        {
            var training = await GetTrainingByIdAsync(TrainingId);
            if (training == null) throw new Exception("Trénink pro klonování nenalezen");

            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var clone = Clone(training, db);

            db.Trainings.Add(clone);
            await db.SaveChangesAsync();

            return clone;
        }


        private Training Clone(Training training, FloorballTrainingContext db)
        {
            var clone = new Training
            {
                Id = default,
                Place = training.Place,
                Name = training.Name + " - kopie",
                Description = training.Description,
                Duration = training.Duration,
                PersonsMin = training.PersonsMin,
                PersonsMax = training.PersonsMax,
                GoaliesMin = training.GoaliesMin,
                GoaliesMax = training.GoaliesMax,
                TrainingGoal1 = training.TrainingGoal1,
                TrainingGoal1Id = training.TrainingGoal1Id,
                TrainingGoal2 = training.TrainingGoal2,
                TrainingGoal2Id = training.TrainingGoal2Id,
                TrainingGoal3 = training.TrainingGoal3,
                TrainingGoal3Id = training.TrainingGoal3Id,
                Difficulty = training.Difficulty,
                Intensity = training.Intensity,
                CommentBefore = training.CommentBefore,
                CommentAfter = training.CommentAfter,
                TrainingParts = training.TrainingParts,
                TrainingAgeGroups = training.TrainingAgeGroups
            };

            if (clone.Place != null) db.Entry(clone.Place!).State = EntityState.Unchanged;
            if (clone.TrainingGoal1 != null) db.Entry(clone.TrainingGoal1!).State = EntityState.Unchanged;
            if (clone.TrainingGoal2 != null) db.Entry(clone.TrainingGoal2!).State = EntityState.Unchanged;
            if (clone.TrainingGoal3 != null) db.Entry(clone.TrainingGoal3!).State = EntityState.Unchanged;

            if (clone.TrainingParts != null)
            {
                foreach (var trainingPart in clone.TrainingParts)
                {
                    trainingPart.Id = default;
                    db.Entry(trainingPart).State = EntityState.Added;


                    if (trainingPart.TrainingGroups != null)
                    {
                        foreach (var trainingGroup in trainingPart.TrainingGroups)
                        {
                            trainingGroup.Id = default;
                            db.Entry(trainingGroup).State = EntityState.Added;

                            if (trainingGroup.Activity != null)
                                db.Entry(trainingGroup.Activity).State = EntityState.Unchanged;
                        }
                    }
                }
            }


            foreach (var trainingAgeGroup in clone.TrainingAgeGroups)
            {
                trainingAgeGroup.Id = default;
                db.Entry(trainingAgeGroup).State = EntityState.Added;
                if (trainingAgeGroup.AgeGroup != null) db.Entry(trainingAgeGroup.AgeGroup!).State = EntityState.Unchanged;
            }


            return clone;
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




    }
}