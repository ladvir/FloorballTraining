using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TrainingEFCoreRepository : ITrainingRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public TrainingEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }


        public async Task<IEnumerable<Training>> GetTrainingsByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Trainings.Where(t =>
                    (string.IsNullOrWhiteSpace(searchString) || t.Name.ToLower().Contains(searchString.ToLower()))
                )
                .ToListAsync();
        }

        public async Task<bool> ExistsTrainingByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Trainings.FirstOrDefaultAsync(ag => ag.Name.ToLower().Contains(searchString.ToLower())) != null;
        }

        public async Task AddTrainingAsync(Training training)
        {
            //if (await ExistsTrainingByNameAsync(training.Name))
            //{
            //    await UpdateTrainingAsync(training);
            //    return;
            //}

            await using var db = await _dbContextFactory.CreateDbContextAsync();


            db.Entry(training.TrainingGoal!).State = EntityState.Unchanged;

            if (training.TrainingAgeGroups.Any())
            {
                foreach (var trainingAgeGroup in training.TrainingAgeGroups)
                {
                    db.Entry(trainingAgeGroup.AgeGroup).State = EntityState.Unchanged;
                }
            }

            if (training.TrainingParts.Any())
            {
                foreach (var activity in training.TrainingParts.SelectMany(tp => tp.TrainingGroups)
                             .SelectMany(trainingGroup => trainingGroup.TrainingGroupActivities).Select(a => a.Activity!))
                {

                    db.Entry(activity).State = EntityState.Unchanged;

                    foreach (var equipment in activity.ActivityEquipments.Where(g => g.Equipment != null))
                    {
                        db.Entry(equipment.Equipment!).State = EntityState.Unchanged;
                    }

                    foreach (var ageGroup in activity.ActivityAgeGroups.Where(g => g.AgeGroup != null))
                    {
                        db.Entry(ageGroup.AgeGroup!).State = EntityState.Unchanged;
                    }

                    foreach (var tag in activity.ActivityTags.Where(g => g.Tag != null))
                    {
                        db.Entry(tag.Tag!).State = EntityState.Unchanged;
                    }

                    foreach (var medium in activity.ActivityMedium)
                    {
                        db.Entry(medium).State = EntityState.Unchanged;
                    }
                }
            }
            db.Trainings.Add(training);

            await db.SaveChangesAsync();
        }

        public async Task<List<string?>> GetEquipmentByTrainingIdAsync(int trainingId)
        {
            var training = await GetTrainingByIdAsync(trainingId);

            return training.TrainingParts.SelectMany(tp => tp.TrainingGroups!)
                .SelectMany(tg => tg.TrainingGroupActivities).Select(tga => tga.Activity).AsEnumerable()
                .SelectMany(a => a!.ActivityEquipments).Select(t => t.Equipment?.Name).ToList();
        }

        public async Task<IEnumerable<Training>> GetTrainingsByCriteriaAsync(SearchCriteria criteria)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Trainings
                .Include(t => t.TrainingGoal)
                .Include(t => t.TrainingAgeGroups).ThenInclude(ag => ag.AgeGroup)
                .Include(t => t.TrainingParts)
                /*.Where(t =>

                criteria == new SearchCriteria() //nejsou zadna kriteria=>chci vybrat vse

                || (criteria.DurationMin.HasValue || (criteria.DurationMin.HasValue && t.Duration >= criteria.DurationMin)
                    && (!criteria.DurationMax.HasValue || (criteria.DurationMax.HasValue && t.Duration <= criteria.DurationMax))
                    && (!criteria.PersonsMin.HasValue || (criteria.PersonsMin.HasValue && t.PersonsMax >= criteria.PersonsMin))
                    && (!criteria.PersonsMax.HasValue || (criteria.PersonsMax.HasValue && t.PersonsMin <= criteria.PersonsMax))
                    && (!criteria.DifficultyMin.HasValue || (criteria.DifficultyMin.HasValue && t.Difficulty >= criteria.DifficultyMin))
                    && (!criteria.DifficultyMax.HasValue || (criteria.DifficultyMax.HasValue && t.Difficulty <= criteria.DifficultyMax))
                    && (!criteria.IntensityMin.HasValue || (criteria.IntensityMin.HasValue && t.Intesity >= criteria.IntensityMin))
                    && (!criteria.IntensityMax.HasValue || (criteria.IntensityMax.HasValue && t.Intesity <= criteria.IntensityMax))
                    && (string.IsNullOrEmpty(criteria.Text) || ((!string.IsNullOrEmpty(t.Description) && t.Description.ToLower().Contains(criteria.Text.ToLower())) || t.Name.ToLower().Contains(criteria.Text.ToLower())))
                    && (!criteria.Tags.Any() || (criteria.Tags.Exists(tag => tag.TagId == t.TrainingGoal!.TagId)))

                    && (!criteria.AgeGroups.Any() || criteria.AgeGroups.Exists(ag => ag.IsKdokoliv())) || (t.TrainingAgeGroups.Any(tag => criteria.AgeGroups.Contains(tag.AgeGroup)))

        )
        )*/
                .AsNoTracking()
                .ToListAsync();

            return result;

        }

        public async Task<Training> GetTrainingByIdAsync(int trainingId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Trainings
                .Include(t => t.TrainingAgeGroups).ThenInclude(tag => tag.AgeGroup)
                .Include(t => t.TrainingGoal)
                .Include(t => t.TrainingParts)
                .ThenInclude(tp => tp.TrainingGroups)
                .ThenInclude(tg => tg.TrainingGroupActivities)
                .ThenInclude(a => a.Activity).ThenInclude(tag => tag!.ActivityTags)
                .FirstAsync(a => a.TrainingId == trainingId);
        }


        public async Task UpdateTrainingAsync(Training training)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var existingTraining = db.Trainings
                .Include(t => t.TrainingAgeGroups).ThenInclude(tag => tag.AgeGroup)
                .Include(t => t.TrainingGoal)
                .Include(t => t.TrainingParts)
                .ThenInclude(tp => tp.TrainingGroups)
                .ThenInclude(tg => tg.TrainingGroupActivities)
                .ThenInclude(a => a.Activity).ThenInclude(tag => tag!.ActivityTags)

                .First(a => a.TrainingId == training.TrainingId);



            UpdateTrainingAgeGroups(training, existingTraining, db);

            UpdateTrainingParts(training, existingTraining, db);

            db.Entry(existingTraining).CurrentValues.SetValues(training);

            existingTraining.TrainingGoal = training.TrainingGoal;

            db.Entry(existingTraining.TrainingGoal).State = EntityState.Unchanged;




            await db.SaveChangesAsync();
        }

        private static void UpdateTrainingAgeGroups(Training training, Training existingTraining, FloorballTrainingContext db)
        {
            foreach (var trainingAgeGroup in training.TrainingAgeGroups)
            {
                var existingActivityAgeGroup = existingTraining.TrainingAgeGroups
                    .FirstOrDefault(p => p.AgeGroupId == trainingAgeGroup.AgeGroup!.AgeGroupId);

                if (existingActivityAgeGroup == null)
                {
                    existingTraining.AddAgeGroup(trainingAgeGroup.AgeGroup!);
                    db.Entry(trainingAgeGroup.AgeGroup!).State = EntityState.Unchanged;
                }
            }

            foreach (var existingTrainingAgeGroup in existingTraining.TrainingAgeGroups.Where(a => a.TrainingAgeGroupId > 0)
                         .ToList())
            {
                var isExisting = training.TrainingAgeGroups.Any(p => p.AgeGroupId == existingTrainingAgeGroup.AgeGroupId);

                if (!isExisting)
                {
                    existingTraining.TrainingAgeGroups.Remove(existingTrainingAgeGroup);
                    db.Entry(existingTraining).State = EntityState.Unchanged;
                }
            }
        }

        private static void UpdateTrainingParts(Training training, Training existingTraining, FloorballTrainingContext db)
        {
            foreach (var trainingPart in training.TrainingParts)
            {
                var existingTrainingPart = existingTraining.TrainingParts
                    .FirstOrDefault(p => p.TrainingPartId == trainingPart.TrainingPartId);

                if (existingTrainingPart == null)
                {
                    foreach (var activity in trainingPart.TrainingGroups.SelectMany(trainingGroup => trainingGroup.TrainingGroupActivities)
                                 .Select(a => a.Activity!))
                    {
                        SetActivityAsUnchanged(db, activity);
                    }

                    existingTraining.AddTrainingPart(trainingPart);
                }
                else
                {
                    foreach (var traininGroup in trainingPart.TrainingGroups)
                    {
                        var existingTrainingGroup = existingTrainingPart?.TrainingGroups.FirstOrDefault(p => p.TrainingGroupId == trainingPart.TrainingPartId);

                        if (existingTrainingGroup == null)
                        {
                            foreach (var activity in traininGroup.TrainingGroupActivities.Select(a => a.Activity!))
                            {
                                SetActivityAsUnchanged(db, activity);
                            }
                            existingTrainingPart!.TrainingGroups.Add(traininGroup);
                        }
                        else
                        {

                            foreach (var traininGroupActivity in traininGroup.TrainingGroupActivities)
                            {
                                var existingTrainingGroupActivity = existingTrainingGroup.TrainingGroupActivities
                                    .FirstOrDefault(p =>
                                        p.TrainingGroupActivityId == traininGroupActivity.TrainingGroupActivityId);

                                if (existingTrainingGroupActivity == null)
                                {
                                    SetActivityAsUnchanged(db, traininGroupActivity.Activity!);
                                    existingTrainingGroup.TrainingGroupActivities.Add(traininGroupActivity);
                                }
                            }

                            foreach (var existingTrainingGroupActivity in existingTrainingGroup.TrainingGroupActivities.Where(a => a.TrainingGroupActivityId > 0)
                                         .ToList())
                            {
                                var isExisting = traininGroup.TrainingGroupActivities.Any(p => p.TrainingGroupActivityId == existingTrainingGroupActivity.TrainingGroupActivityId);

                                if (!isExisting)
                                {
                                    existingTrainingGroup.TrainingGroupActivities.Remove(existingTrainingGroupActivity);
                                    SetActivityAsUnchanged(db, existingTrainingGroupActivity.Activity!);
                                }
                            }
                        }
                    }

                    foreach (var existingTrainingGroup in existingTrainingPart!.TrainingGroups.Where(a => a.TrainingGroupId > 0)
                                 .ToList())
                    {
                        var isExisting = trainingPart.TrainingGroups.Any(p => p.TrainingGroupId == existingTrainingGroup.TrainingGroupId);

                        if (!isExisting)
                        {
                            existingTrainingPart.TrainingGroups.Remove(existingTrainingGroup);
                            db.Entry(existingTrainingPart).State = EntityState.Unchanged;
                        }
                    }
                }
            }

            foreach (var existingTrainingPart in existingTraining.TrainingParts.Where(a => a.TrainingPartId > 0)
                         .ToList())
            {
                var isExisting = training.TrainingParts.Any(p => p.TrainingPartId == existingTrainingPart.TrainingPartId);

                if (!isExisting)
                {
                    existingTraining.TrainingParts.Remove(existingTrainingPart);
                    db.Entry(existingTraining).State = EntityState.Unchanged;
                }
            }
        }

        private static void SetActivityAsUnchanged(FloorballTrainingContext db, Activity activity)
        {
            db.Entry(activity).State = EntityState.Unchanged;

            foreach (var equipment in activity.ActivityEquipments.Where(g => g.Equipment != null))
            {
                db.Entry(equipment.Equipment!).State = EntityState.Unchanged;
            }

            foreach (var ageGroup in activity.ActivityAgeGroups.Where(g => g.AgeGroup != null))
            {
                db.Entry(ageGroup.AgeGroup!).State = EntityState.Unchanged;
            }

            foreach (var tag in activity.ActivityTags.Where(g => g.Tag != null))
            {
                db.Entry(tag.Tag!).State = EntityState.Unchanged;
            }

            foreach (var medium in activity.ActivityMedium)
            {
                db.Entry(medium).State = EntityState.Unchanged;
            }
        }
    }
}