using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;


namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class ActivityEFCoreRepository : IActivityRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public ActivityEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }


        public async Task<IEnumerable<Activity>> GetActivitiesByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            return await db.Activities.Where(t =>
                    (string.IsNullOrWhiteSpace(searchString) || t.Name.ToLower().Contains(searchString.ToLower()))
                ).ToListAsync();
        }

        public async Task<IEnumerable<Activity>> GetActivitiesByCriteriaAsync(SearchCriteria criteria)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Activities.Where(t =>

                criteria == new SearchCriteria() //nejsou zadna kriteria=>chci vybrat vse

                || (criteria.DurationMin.HasValue || (criteria.DurationMin.HasValue && t.DurationMin >= criteria.DurationMin)
                    && (!criteria.DurationMax.HasValue || (criteria.DurationMax.HasValue && t.DurationMax <= criteria.DurationMax))
                    && (!criteria.PersonsMin.HasValue || (criteria.PersonsMin.HasValue && t.PersonsMax >= criteria.PersonsMin))
                    && (!criteria.PersonsMax.HasValue || (criteria.PersonsMax.HasValue && t.PersonsMin <= criteria.PersonsMax))
                    && (!criteria.DifficultyMin.HasValue || (criteria.DifficultyMin.HasValue && t.Difficulty >= criteria.DifficultyMin))
                    && (!criteria.DifficultyMax.HasValue || (criteria.DifficultyMax.HasValue && t.Difficulty <= criteria.DifficultyMax))
                    && (!criteria.IntensityMin.HasValue || (criteria.IntensityMin.HasValue && t.Intesity >= criteria.IntensityMin))
                    && (!criteria.IntensityMax.HasValue || (criteria.IntensityMax.HasValue && t.Intesity <= criteria.IntensityMax))
                    && (string.IsNullOrEmpty(criteria.Text) || ((!string.IsNullOrEmpty(t.Description) && t.Description.ToLower().Contains(criteria.Text.ToLower())) || t.Name.ToLower().Contains(criteria.Text.ToLower())))
                    && (!criteria.Tags.Any() || (criteria.Tags.Exists(tag => t.ActivityTags.Any(at => at.TagId == tag.TagId))

                    && (!criteria.AgeGroups.Any() || criteria.AgeGroups.Exists(ag => ag.IsKdokoliv())) || (t.ActivityAgeGroups.Any(tag => criteria.AgeGroups.Contains(tag.AgeGroup)))
                        )
            ))).ToListAsync();

            return result;
        }

        public async Task<bool> ExistsActivityByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Activities.FirstOrDefaultAsync(ag => ag.Name.ToLower().Contains(searchString.ToLower())) != null;
        }

        public async Task AddActivityAsync(Activity activity)
        {

            await using var db = await _dbContextFactory.CreateDbContextAsync();

            if (await ExistsActivityByNameAsync(activity.Name))
            {
                await UpdateActivityAsync(activity);
                return;
            }

            db.Activities.Add(activity);

            SetActivityAgeGroupsAsUnchanged(activity);

            SetTrainingGroupActivitiesAsUnchanged(activity);

            SetActivityEquipmentsAsUnchanged(activity);

            SetActivityMediumAsUnchanged(activity);

            SetActivityTagsAsUnchanged(activity);


            await db.SaveChangesAsync();


        }

        private void SetActivityTagsAsUnchanged(Activity activity)
        {

            if (activity.ActivityTags.Any())
            {
                using var db = _dbContextFactory.CreateDbContext();
                foreach (var activityTag in activity.ActivityTags)
                {
                    if (activityTag.Tag != null) db.Entry(activityTag.Tag).State = EntityState.Unchanged;
                }
            }
        }

        private void SetActivityMediumAsUnchanged(Activity activity)
        {
            if (activity.ActivityMedium.Any())
            {
                using var db = _dbContextFactory.CreateDbContext();
                foreach (var activityMedia in activity.ActivityMedium)
                {
                    if (activityMedia.Media != null) db.Entry(activityMedia.Media).State = EntityState.Unchanged;
                }
            }
        }

        private void SetActivityEquipmentsAsUnchanged(Activity activity)
        {
            if (activity.ActivityEquipments.Any())
            {
                using var db = _dbContextFactory.CreateDbContext();
                foreach (var activityEquipment in activity.ActivityEquipments)
                {
                    if (activityEquipment.Equipment != null)
                        db.Entry(activityEquipment.Equipment).State = EntityState.Unchanged;
                }
            }
        }

        private void SetTrainingGroupActivitiesAsUnchanged(Activity activity)
        {
            if (activity.TrainingGroupActivities.Any())
            {
                using var db = _dbContextFactory.CreateDbContext();
                foreach (var trainingGroupActivity in activity.TrainingGroupActivities)
                {
                    if (trainingGroupActivity.TrainingGroup != null)
                        db.Entry(trainingGroupActivity.TrainingGroup).State = EntityState.Unchanged;
                }
            }
        }

        private void SetActivityAgeGroupsAsUnchanged(Activity activity)
        {
            if (activity.ActivityAgeGroups.Any())
            {
                using var db = _dbContextFactory.CreateDbContext();
                foreach (var activityActivityAge in activity.ActivityAgeGroups)
                {
                    db.Entry(activityActivityAge.AgeGroup).State = EntityState.Unchanged;
                }
            }
        }

        public async Task<Activity> GetActivityByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Activities.FindAsync(activityId) ?? new Activity();
        }

        public async Task<Activity> CloneActivityAsync(Activity activity)
        {
            var clone = activity.Clone();
            clone.Name = string.Concat(clone.Name, " - kopie");

            await AddActivityAsync(clone);

            return clone;
        }

        public async Task DeleteActivityAsync(Activity activity)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Activities.Remove(activity);

            SetActivityAgeGroupsAsUnchanged(activity);

            SetTrainingGroupActivitiesAsUnchanged(activity);

            SetActivityEquipmentsAsUnchanged(activity);

            SetActivityMediumAsUnchanged(activity);

            SetActivityTagsAsUnchanged(activity);

            await db.SaveChangesAsync();
        }

        public async Task<int?> GetActivityNextByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Activities.FirstOrDefaultAsync(a => a.ActivityId > activityId);
            return result?.ActivityId;
        }

        public async Task<int?> GetActivityPrevByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Activities.FirstOrDefaultAsync(a => a.ActivityId < activityId);
            return result?.ActivityId;
        }

        public async Task UpdateActivityAsync(Activity activity)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingActivity = await GetActivityByIdAsync(activity.ActivityId);
            existingActivity.Merge(activity);




            db.Activities.Update(existingActivity);
            SetActivityAgeGroupsAsUnchanged(activity);

            SetTrainingGroupActivitiesAsUnchanged(activity);

            SetActivityEquipmentsAsUnchanged(activity);

            SetActivityMediumAsUnchanged(activity);

            SetActivityTagsAsUnchanged(activity);

            await db.SaveChangesAsync();

        }


    }
}