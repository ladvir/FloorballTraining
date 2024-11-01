using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class ActivityEfCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Activity>(dbContextFactory), IActivityRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;

        public async Task<IReadOnlyList<Activity>> GetActivitiesByCriteriaAsync(SearchCriteria criteria)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var requestedTagIds = criteria.Tags.Select(t => t.Id).ToList();
            var requestedAgeGroupIds = criteria.AgeGroups.Select(t => t.Id).ToList();

            return await db.Activities
                .Include(a => a.ActivityAgeGroups)//.ThenInclude(aag => aag.AgeGroup)
                .Include(a => a.ActivityTags).ThenInclude(at => at.Tag)
                .Where(t => criteria == new SearchCriteria() //nejsou zadna kriteria=>chci vybrat vse
                            || (

                                (!criteria.Ids.Any() || criteria.Ids.Contains(t.Id))
                                && (!criteria.DurationMin.HasValue || (criteria.DurationMin.HasValue &&
                                                                       t.DurationMin >= criteria.DurationMin))
                                && (!criteria.DurationMax.HasValue || (criteria.DurationMax.HasValue &&
                                                                       t.DurationMax <= criteria.DurationMax))
                                && (!criteria.PersonsMin.HasValue || (criteria.PersonsMin.HasValue && t.PersonsMin >= criteria.PersonsMin))
                                && (!criteria.PersonsMax.HasValue || (criteria.PersonsMax.HasValue && t.PersonsMax <= criteria.PersonsMax))
                                && (!criteria.GoaliesMin.HasValue || (criteria.GoaliesMin.HasValue && t.GoaliesMin >= criteria.GoaliesMin))
                                && (!criteria.GoaliesMax.HasValue || (criteria.GoaliesMax.HasValue && t.GoaliesMax <= criteria.GoaliesMax))
                                && (!criteria.DifficultyMin.HasValue || (criteria.DifficultyMin.HasValue && t.Difficulty >= criteria.DifficultyMin))
                                && (!criteria.DifficultyMax.HasValue || (criteria.DifficultyMax.HasValue && t.Difficulty <= criteria.DifficultyMax))
                                && (!criteria.IntensityMin.HasValue || (criteria.IntensityMin.HasValue && t.Intensity >= criteria.IntensityMin))
                                && (!criteria.IntensityMax.HasValue || (criteria.IntensityMax.HasValue && t.Intensity <= criteria.IntensityMax))
                                && (string.IsNullOrEmpty(criteria.Text) || ((!string.IsNullOrEmpty(t.Description) && t.Description.ToLower()
                                    .Contains(criteria.Text.ToLower())) || t.Name.ToLower().Contains(criteria.Text.ToLower())))
                                && (!requestedTagIds.Any() || t.ActivityTags.AsEnumerable().Any(at => requestedTagIds.Contains((int)at.TagId!)))
                                && (!requestedAgeGroupIds.Any()
                                    || t.ActivityAgeGroups.AsEnumerable().Any(at => requestedAgeGroupIds.Contains((int)at.AgeGroupId!))
                                    || t.ActivityAgeGroups.AsEnumerable().Any(at => at.AgeGroupId != null && at.AgeGroupId == 1)
                                    // || t.ActivityAgeGroups.Any(at => at.AgeGroup != null && at.AgeGroup.IsAnyAge())
                                    || requestedAgeGroupIds.Contains(1)
                                )
                            ))
                .AsSingleQuery()
                //.AsNoTracking()
                .ToListAsync();
        }

        public async Task AddActivityAsync(Activity activity)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            SetActivityAgeGroupsAsUnchanged(activity, db);

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



        private static void SetActivityAgeGroupsAsUnchanged(Activity activity, FloorballTrainingContext floorballTrainingContext)
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

            var re = await db.Activities.Where(a => a.Id == activityId)
                .Include(a => a.ActivityAgeGroups).ThenInclude(t => t.AgeGroup)
                .Include(a => a.ActivityEquipments).ThenInclude(t => t.Equipment)
                .Include(a => a.ActivityMedium)
                .Include(a => a.ActivityTags).ThenInclude(t => t.Tag)
                .AsNoTracking()
                //.AsSplitQuery()
                //.AsSingleQuery()
                .FirstOrDefaultAsync();


            return re ?? new Activity();

        }

        public async Task<Activity> CloneActivityAsync(int activityId)
        {
            var activity = await GetActivityByIdAsync(activityId);

            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var clone = Clone(activity, db);

            db.Activities.Add(clone);
            await db.SaveChangesAsync();

            return clone;
        }

        private Activity Clone(Activity activity, FloorballTrainingContext db)
        {
            var clone = new Activity
            {
                Id = default,
                PlaceWidth = activity.PlaceWidth,
                PlaceLength = activity.PlaceLength,
                Environment = activity.Environment,
                Name = activity.Name + " - kopie",
                Description = activity.Description,
                DurationMin = activity.DurationMin,
                DurationMax = activity.DurationMax,
                PersonsMin = activity.PersonsMin,
                PersonsMax = activity.PersonsMax,
                GoaliesMin = activity.GoaliesMin,
                GoaliesMax = activity.GoaliesMax,
                Intensity = activity.Intensity,
                Difficulty = activity.Difficulty,
                ActivityTags = activity.ActivityTags,
                ActivityEquipments = activity.ActivityEquipments,
                ActivityMedium = activity.ActivityMedium,
                ActivityAgeGroups = activity.ActivityAgeGroups
            };

            foreach (var activityTag in clone.ActivityTags)
            {
                activityTag.Id = default;
                db.Entry(activityTag).State = EntityState.Added;
                if (activityTag.Tag != null) db.Entry(activityTag.Tag!).State = EntityState.Unchanged;
            }


            foreach (var activityEquipment in clone.ActivityEquipments)
            {
                activityEquipment.Id = default;
                db.Entry(activityEquipment).State = EntityState.Added;
                if (activityEquipment.Equipment != null) db.Entry(activityEquipment.Equipment!).State = EntityState.Unchanged;
            }

            foreach (var activityAgeGroup in clone.ActivityAgeGroups)
            {
                activityAgeGroup.Id = default;
                db.Entry(activityAgeGroup).State = EntityState.Added;
                if (activityAgeGroup.AgeGroup != null) db.Entry(activityAgeGroup.AgeGroup!).State = EntityState.Unchanged;
            }

            foreach (var activityMedia in clone.ActivityMedium)
            {
                activityMedia.Id = default;
                db.Entry(activityMedia).State = EntityState.Added;
            }


            return clone;
        }

        public async Task DeleteActivityAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var activity = await GetActivityByIdAsync(activityId);

            SetActivityAgeGroupsAsUnchanged(activity, db);

            SetActivityEquipmentsAsUnchanged(activity, db);

            SetActivityTagsAsUnchanged(activity, db);

            db.Activities.Remove(activity);

            await db.SaveChangesAsync();
        }



        public async Task<int?> GetActivityNextByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Activities.OrderBy(a => a.Id).FirstOrDefaultAsync(a => a.Id > activityId);
            return result?.Id;
        }

        public async Task<int?> GetActivityPrevByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Activities.OrderBy(a => a.Id).LastOrDefaultAsync(a => a.Id < activityId);
            return result?.Id;
        }






        public async Task UpdateActivityAsync(Activity activity)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingActivity = db.Activities.Where(a => a.Id == activity.Id)
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

            UpdateActivityMedium(activity, existingActivity);

            db.Entry(existingActivity).CurrentValues.SetValues(activity);

            await db.SaveChangesAsync();

        }

        private static void UpdateActivityMedium(Activity activity, Activity existingActivity)
        {
            foreach (var activityMedia in activity.ActivityMedium)
            {
                var existingActivityMedia = existingActivity.ActivityMedium
                    .FirstOrDefault(p => p.Id == activityMedia.Id);

                if (existingActivityMedia == null)
                {
                    existingActivity.AddMedia(activityMedia);
                }
            }

            foreach (var existingActivityMedia in existingActivity.ActivityMedium.Where(a => a.Id > 0)
                         .ToList())
            {
                var isExisting = activity.ActivityMedium.Any(p => p.Id == existingActivityMedia.Id);

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
                    .FirstOrDefault(p => p.TagId == activityTags.Tag!.Id);

                if (existingActivityTag == null)
                {
                    existingActivity.AddTag(activityTags.Tag!);
                    db.Entry(activityTags.Tag!).State = EntityState.Unchanged;
                }
            }

            foreach (var existingActivityTag in existingActivity.ActivityTags.Where(a => a.Id > 0)
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
                    .FirstOrDefault(p => p.EquipmentId == activityEquipment.Equipment?.Id);

                if (existingActivityEquipment == null)
                {
                    existingActivity.AddEquipment(activityEquipment.Equipment!);
                    db.Entry(activityEquipment.Equipment!).State = EntityState.Unchanged;
                }
            }

            foreach (var existingActivityEquipment in existingActivity.ActivityEquipments.Where(a => a.Id > 0)
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
                    .FirstOrDefault(p => p.AgeGroupId == activityAgeGroup.AgeGroup!.Id);

                if (existingActivityAgeGroup == null)
                {
                    existingActivity.AddAgeGroup(activityAgeGroup.AgeGroup!);
                    db.Entry(activityAgeGroup.AgeGroup!).State = EntityState.Unchanged;
                }
            }

            foreach (var existingActivityAgeGroup in existingActivity.ActivityAgeGroups.Where(a => a.Id > 0)
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