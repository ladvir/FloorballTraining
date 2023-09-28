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
            if (await ExistsTrainingByNameAsync(training.Name))
            {
                await UpdateTrainingAsync(training);
                return;
            }

            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Trainings.Add(training);

            db.Entry(training.TrainingGoal!).State = EntityState.Unchanged;

            if (training.TrainingAgeGroups.Any())
            {
                foreach (var trainingAgeGroup in training.TrainingAgeGroups)
                {
                    db.Entry(trainingAgeGroup.AgeGroup).State = EntityState.Unchanged;
                }
            }

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
            var result = await db.Trainings.Where(t =>

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
        ).ToListAsync();

            return result;

        }

        public async Task<Training> GetTrainingByIdAsync(int trainingId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Trainings.FindAsync(trainingId) ?? new Training();
        }


        public async Task UpdateTrainingAsync(Training training)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var existingTraining = db.Trainings.Include(t => t.TrainingAgeGroups).Include(t => t.TrainingParts).FirstOrDefault(a => a.TrainingId == training.TrainingId) ?? new Training();

            existingTraining.Merge(training);

            await db.SaveChangesAsync();
        }
    }
}