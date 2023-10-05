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

            return await db.Activities.Include(a => a.ActivityAgeGroups)
                .Include(a => a.ActivityEquipments)
                .Include(a => a.ActivityMedium)
                .Include(a => a.ActivityTags).Where(t =>
                    (string.IsNullOrWhiteSpace(searchString) || t.Name.ToLower().Contains(searchString.ToLower()))
                ).ToListAsync();
        }

        public async Task<IEnumerable<Activity>> GetActivitiesByCriteriaAsync(SearchCriteria criteria)
        {
            IEnumerable<Activity> result = new List<Activity>();

            await using (var db = await _dbContextFactory.CreateDbContextAsync())
            {

                var requestedTagIds = criteria.Tags.Select(t => t.TagId).ToList();
                var requestedAgeGroupIds = criteria.AgeGroups.Select(t => t.AgeGroupId).ToList();

                return await db.Activities
                    .Include(a => a.ActivityAgeGroups)//.ThenInclude(aag => aag.AgeGroup)
                    .Include(a => a.ActivityTags).ThenInclude(at => at.Tag)
                    .Where(t => criteria == new SearchCriteria() //nejsou zadna kriteria=>chci vybrat vse
                                || ((!criteria.DurationMin.HasValue || (criteria.DurationMin.HasValue &&
                                                                        t.DurationMin >= criteria.DurationMin))
                                    && (!criteria.DurationMax.HasValue || (criteria.DurationMax.HasValue &&
                                                                           t.DurationMax <= criteria.DurationMax))
                                    // && (!criteria.PersonsMin.HasValue || (criteria.PersonsMin.HasValue && t.PersonsMin >= criteria.PersonsMin))
                                    // && (!criteria.PersonsMax.HasValue || (criteria.PersonsMax.HasValue && t.PersonsMax <= criteria.PersonsMax))
                                    && (!criteria.DifficultyMin.HasValue || (criteria.DifficultyMin.HasValue &&
                                                                             t.Difficulty >= criteria.DifficultyMin))
                                    && (!criteria.DifficultyMax.HasValue || (criteria.DifficultyMax.HasValue &&
                                                                             t.Difficulty <= criteria.DifficultyMax))
                                    && (!criteria.IntensityMin.HasValue || (criteria.IntensityMin.HasValue &&
                                                                            t.Intesity >= criteria.IntensityMin))
                                    && (!criteria.IntensityMax.HasValue || (criteria.IntensityMax.HasValue &&
                                                                            t.Intesity <= criteria.IntensityMax))
                                    && (string.IsNullOrEmpty(criteria.Text) ||
                                        ((!string.IsNullOrEmpty(t.Description) && t.Description.ToLower()
                                             .Contains(criteria.Text.ToLower())) ||
                                         t.Name.ToLower().Contains(criteria.Text.ToLower())))
                                    && (!requestedTagIds.Any() || t.ActivityTags.AsEnumerable().Any(at => requestedTagIds.Contains((int)at.TagId!)))
                                    && (!requestedAgeGroupIds.Any() || t.ActivityAgeGroups.AsEnumerable().Any(at => requestedAgeGroupIds.Contains(((int)at.AgeGroupId!))))



                                ))
                    .AsSingleQuery()
                    //.AsNoTracking()
                    .ToListAsync();
            }
        }


        public IEnumerable<Activity> GetActivitiesByCriteria(SearchCriteria criteria)
        {
            using var db = _dbContextFactory.CreateDbContext();
            var result = db.Activities
                    .Include(a => a.ActivityAgeGroups)//.ThenInclude(aag => aag.AgeGroup)
                                                      //.Include(a => a.ActivityEquipments)//.ThenInclude(ae => ae.Equipment)
                    .Include(a => a.ActivityTags)//.ThenInclude(at => at.Tag).ThenInclude(act => act!.ActivityTags)


                    .Where(t => criteria == new SearchCriteria() //nejsou zadna kriteria=>chci vybrat vse
                                || (
                                    (!criteria.DurationMin.HasValue || (criteria.DurationMin.HasValue && t.DurationMin >= criteria.DurationMin))
                                    && (!criteria.DurationMax.HasValue || (criteria.DurationMax.HasValue && t.DurationMax <= criteria.DurationMax))
                                    // && (!criteria.PersonsMin.HasValue || (criteria.PersonsMin.HasValue && t.PersonsMin >= criteria.PersonsMin))
                                    // && (!criteria.PersonsMax.HasValue || (criteria.PersonsMax.HasValue && t.PersonsMax <= criteria.PersonsMax))
                                    && (!criteria.DifficultyMin.HasValue || (criteria.DifficultyMin.HasValue && t.Difficulty >= criteria.DifficultyMin))
                                    && (!criteria.DifficultyMax.HasValue || (criteria.DifficultyMax.HasValue && t.Difficulty <= criteria.DifficultyMax))
                                    && (!criteria.IntensityMin.HasValue || (criteria.IntensityMin.HasValue && t.Intesity >= criteria.IntensityMin))
                                    && (!criteria.IntensityMax.HasValue || (criteria.IntensityMax.HasValue && t.Intesity <= criteria.IntensityMax))
                                    && (string.IsNullOrEmpty(criteria.Text) || ((!string.IsNullOrEmpty(t.Description) && t.Description.ToLower().Contains(criteria.Text.ToLower())) || t.Name.ToLower().Contains(criteria.Text.ToLower())))
                                    && (!criteria.Tags.Any() || criteria.Tags.Exists(tag => t.ActivityTags.Select(s => s.TagId).Contains(tag.TagId)))

                                /*&& (!criteria.AgeGroups.Any() // || criteria.AgeGroups.Exists(ag => ag.IsKdokoliv())
                                              || criteria.AgeGroups.Exists(c => t.ActivityAgeGroups.Select(s => s.AgeGroupId).Contains(c.AgeGroupId))
                                              )*/
                                ))
                //.AsSingleQuery()
                //.AsNoTracking()
                //.ToList()
                ;
            return result;
        }


        public async Task<bool> ExistsActivityByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Activities.FirstOrDefaultAsync(ag => ag.Name.ToLower().Contains(searchString.ToLower())) != null;
        }

        public async Task AddActivityAsync(Activity activity)
        {



            //if (await ExistsActivityByNameAsync(activity.Name))
            //{
            //    await UpdateActivityAsync(activity);
            //    return;
            //}

            await using var db = await _dbContextFactory.CreateDbContextAsync();



            SetActivityAgeGroupsAsUnchanged(activity, db);

            SetTrainingGroupActivitiesAsUnchanged(activity, db);

            SetActivityEquipmentsAsUnchanged(activity, db);



            SetActivityTagsAsUnchanged(activity, db);

            db.Activities.Add(activity);
            await db.SaveChangesAsync();


        }

        private static void SetActivityTagsAsUnchanged(Activity activity, DbContext floorballTrainingContext)
        {

            if (activity.ActivityTags.Any())
            {
                foreach (var activityTag in activity.ActivityTags)
                {
                    if (activityTag.Tag != null) floorballTrainingContext.Entry(activityTag.Tag!).State = EntityState.Unchanged;
                }
            }
        }



        private static void SetActivityEquipmentsAsUnchanged(Activity activity, DbContext floorballTrainingContext)
        {
            if (activity.ActivityEquipments.Any())
            {
                foreach (var activityEquipment in activity.ActivityEquipments)
                {
                    if (activityEquipment.Equipment != null)
                        floorballTrainingContext.Entry(activityEquipment.Equipment).State = EntityState.Unchanged;
                }
            }
        }

        private static void SetTrainingGroupActivitiesAsUnchanged(Activity activity,
            FloorballTrainingContext floorballTrainingContext)
        {
            if (activity.TrainingGroupActivities.Any())
            {
                foreach (var trainingGroupActivity in activity.TrainingGroupActivities)
                {
                    if (trainingGroupActivity.TrainingGroup != null)
                        floorballTrainingContext.Entry(trainingGroupActivity.TrainingGroup).State = EntityState.Unchanged;
                }
            }
        }

        private static void SetActivityAgeGroupsAsUnchanged(Activity activity,
            FloorballTrainingContext floorballTrainingContext)
        {
            if (activity.ActivityAgeGroups.Any())
            {
                foreach (var activityActivityAge in activity.ActivityAgeGroups)
                {
                    floorballTrainingContext.Entry(activityActivityAge.AgeGroup!).State = EntityState.Unchanged;
                }
            }
        }

        public async Task<Activity> GetActivityByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var re = await db.Activities.Where(a => a.ActivityId == activityId)
                .Include(a => a.ActivityAgeGroups).ThenInclude(t => t.AgeGroup)
                .Include(a => a.ActivityEquipments).ThenInclude(t => t.Equipment)
                .Include(a => a.ActivityMedium)
                .Include(a => a.ActivityTags).ThenInclude(t => t.Tag)
                //.AsNoTracking()
                .AsSplitQuery()
                .SingleOrDefaultAsync();

            return re ?? new Activity();
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

            //SetActivityAgeGroupsAsUnchanged(activity, db);

            //SetTrainingGroupActivitiesAsUnchanged(activity, db);

            //SetActivityEquipmentsAsUnchanged(activity, db);

            //SetActivityMediumAsUnchanged(activity, db);

            //SetActivityTagsAsUnchanged(activity, db);

            await db.SaveChangesAsync();
        }

        public async Task<int?> GetActivityNextByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Activities.OrderBy(a => a.ActivityId).FirstOrDefaultAsync(a => a.ActivityId > activityId);
            return result?.ActivityId;
        }

        public async Task<int?> GetActivityPrevByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Activities.OrderBy(a => a.ActivityId).LastOrDefaultAsync(a => a.ActivityId < activityId);
            return result?.ActivityId;
        }






        public async Task UpdateActivityAsync(Activity activity)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingActivity = db.Activities.Where(a => a.ActivityId == activity.ActivityId)
                .Include(a => a.ActivityAgeGroups)//.ThenInclude(g => g.AgeGroup)
                .Include(a => a.ActivityEquipments)
                                                   .Include(a => a.ActivityMedium)
                                                   .Include(a => a.ActivityTags)

                .AsSplitQuery()
                //.AsNoTracking()
                .First();




            UpdateActivityAgeGroups(activity, existingActivity, db);

            UpdateActivityEquipments(activity, existingActivity, db);

            UpdateActivityTags(activity, existingActivity, db);

            UpdateActivityMedium(activity, existingActivity, db);

            db.Entry(existingActivity).CurrentValues.SetValues(activity);

            await db.SaveChangesAsync();

        }

        private static void UpdateActivityMedium(Activity activity, Activity existingActivity, FloorballTrainingContext db)
        {
            foreach (var activityMedia in activity.ActivityMedium)
            {
                var existingActivityMedia = existingActivity.ActivityMedium
                    .FirstOrDefault(p => p.ActivityMediaId == activityMedia.ActivityMediaId);

                if (existingActivityMedia == null)
                {
                    existingActivity.AddMedia(activityMedia);
                }
            }

            foreach (var existingActivityMedia in existingActivity.ActivityMedium.Where(a => a.ActivityMediaId > 0)
                         .ToList())
            {
                var isExisting = activity.ActivityMedium.Any(p => p.ActivityMediaId == existingActivityMedia.ActivityMediaId);

                if (!isExisting)
                {
                    existingActivity.ActivityMedium.Remove(existingActivityMedia);
                }
            }
        }

        private static void UpdateActivityTags(Activity activity, Activity existingActivity, FloorballTrainingContext db)
        {
            foreach (var activityTags in activity.ActivityTags)
            {
                var existingActivityTag = existingActivity.ActivityTags
                    .FirstOrDefault(p => p.TagId == activityTags.Tag!.TagId);

                if (existingActivityTag == null)
                {
                    existingActivity.AddTag(activityTags.Tag!);
                    db.Entry(activityTags.Tag!).State = EntityState.Unchanged;
                }
            }

            foreach (var existingActivityTag in existingActivity.ActivityTags.Where(a => a.ActivityTagId > 0)
                         .ToList())
            {
                var isExisting = activity.ActivityTags.Any(p => p.TagId == existingActivityTag.TagId);

                if (!isExisting)
                {
                    existingActivity.ActivityTags.Remove(existingActivityTag);
                    db.Entry(existingActivity).State = EntityState.Unchanged;
                }
            }
        }

        private static void UpdateActivityEquipments(Activity activity, Activity existingActivity, FloorballTrainingContext db)
        {
            foreach (var activityEquipment in activity.ActivityEquipments)
            {
                var existingActivityEquipment = existingActivity.ActivityEquipments
                    .FirstOrDefault(p => p.EquipmentId == activityEquipment.Equipment?.EquipmentId);

                if (existingActivityEquipment == null)
                {
                    existingActivity.AddEquipment(activityEquipment.Equipment!);
                    db.Entry(activityEquipment.Equipment!).State = EntityState.Unchanged;
                }
            }

            foreach (var existingActivityEquipment in existingActivity.ActivityEquipments.Where(a => a.ActivityEquipmentId > 0)
                         .ToList())
            {
                var isExisting = activity.ActivityEquipments.Any(p => p.EquipmentId == existingActivityEquipment.EquipmentId);

                if (!isExisting)
                {
                    existingActivity.ActivityEquipments.Remove(existingActivityEquipment);
                    db.Entry(existingActivity).State = EntityState.Unchanged;
                }
            }
        }

        private static void UpdateActivityAgeGroups(Activity activity, Activity existingActivity, FloorballTrainingContext db)
        {
            foreach (var activityAgeGroup in activity.ActivityAgeGroups)
            {
                var existingActivityAgeGroup = existingActivity.ActivityAgeGroups
                    .FirstOrDefault(p => p.AgeGroupId == activityAgeGroup.AgeGroup!.AgeGroupId);

                if (existingActivityAgeGroup == null)
                {
                    existingActivity.AddAgeGroup(activityAgeGroup.AgeGroup!);
                    db.Entry(activityAgeGroup.AgeGroup!).State = EntityState.Unchanged;
                }
            }

            foreach (var existingActivityAgeGroup in existingActivity.ActivityAgeGroups.Where(a => a.ActivityAgeGroupId > 0)
                         .ToList())
            {
                var isForRemoval = activity.ActivityAgeGroups.Any(p => p.AgeGroupId == existingActivityAgeGroup.AgeGroupId);

                if (!isForRemoval)
                {
                    existingActivity.ActivityAgeGroups.Remove(existingActivityAgeGroup);
                    db.Entry(existingActivity).State = EntityState.Unchanged;
                }
            }
        }
    }
}