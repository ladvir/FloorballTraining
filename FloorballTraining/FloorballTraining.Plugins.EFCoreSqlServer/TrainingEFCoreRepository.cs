using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TrainingEfCoreRepository : ITrainingRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public TrainingEfCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
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
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var newTraining = training.Clone();

            newTraining.TrainingGoal = null;
            newTraining.TrainingGoalId = training.TrainingGoal!.Id;

            newTraining.Place = null;
            newTraining.PlaceId = training.Place!.Id;

            db.Trainings.Add(newTraining);

            SetTrainingAgeGroupsAsUnchanged(newTraining, db);

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

        public async Task<IEnumerable<Training>> GetTrainingsByCriteriaAsync(SearchCriteria? criteria)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Trainings
                .Include(t => t.TrainingGoal)
                .Include(t => t.Place)
                .Include(t => t.TrainingAgeGroups).
                    ThenInclude(ag => ag.AgeGroup)
                .Include(t => t.TrainingParts!).
                    ThenInclude(tp => tp.TrainingGroups).
                        ThenInclude(tga => tga.Activity)

                .Where(t =>

                criteria == null //nejsou zadna kriteria=>chci vybrat vse

                || (criteria.DurationMin.HasValue || (criteria.DurationMin.HasValue && t.Duration >= criteria.DurationMin)
                    && (!criteria.DurationMax.HasValue || (criteria.DurationMax.HasValue && t.Duration <= criteria.DurationMax))
                    && (!criteria.PersonsMin.HasValue || (criteria.PersonsMin.HasValue && t.PersonsMax >= criteria.PersonsMin))
                    && (!criteria.PersonsMax.HasValue || (criteria.PersonsMax.HasValue && t.PersonsMin <= criteria.PersonsMax))
                    && (!criteria.DifficultyMin.HasValue || (criteria.DifficultyMin.HasValue && t.Difficulty >= criteria.DifficultyMin))
                    && (!criteria.DifficultyMax.HasValue || (criteria.DifficultyMax.HasValue && t.Difficulty <= criteria.DifficultyMax))
                    && (!criteria.IntensityMin.HasValue || (criteria.IntensityMin.HasValue && t.Intensity >= criteria.IntensityMin))
                    && (!criteria.IntensityMax.HasValue || (criteria.IntensityMax.HasValue && t.Intensity <= criteria.IntensityMax))

                    && (!criteria.Places.Any() || (t.Place != null && criteria.Places.Select(p => p.Id).Contains(t.PlaceId)))
        //&& (string.IsNullOrEmpty(criteria.Text) || ((!string.IsNullOrEmpty(t.Description) && t.Description.ToLower().Contains(criteria.Text.ToLower())) || t.Name.ToLower().Contains(criteria.Text.ToLower())))
        && (!criteria.Tags.Any() || criteria.Tags.Any(tag => tag.Id == t.TrainingGoalId))

        // && (!criteria.AgeGroups.Any() || criteria.AgeGroups.Exists(ag => ag.IsKdokoliv())) || (t.TrainingAgeGroups.Any(tag => criteria.AgeGroups.Contains(tag.AgeGroup!)))

        )
        )
                .AsNoTracking()
                .AsSingleQuery()
                .ToListAsync();

            return result;

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

            training.PlaceId = training.Place!.Id;

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
                            var existingTrainingGroupActivity = existingTrainingGroup.Activity;

                            if (existingTrainingGroupActivity == null)
                            {
                                var newActivity = trainingGroup.Activity!.Clone();

                                existingTrainingGroup.Activity = newActivity;
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

        private static void SetTrainingAgeGroupsAsUnchanged(Training training,
            FloorballTrainingContext floorballTrainingContext)
        {
            if (training.TrainingAgeGroups.Any())
            {
                foreach (var ageGroup in training.TrainingAgeGroups)
                {
                    floorballTrainingContext.Entry(ageGroup.AgeGroup!).State = EntityState.Unchanged;
                }
            }
        }
    }
}