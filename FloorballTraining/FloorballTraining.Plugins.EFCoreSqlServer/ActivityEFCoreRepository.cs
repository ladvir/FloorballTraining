﻿using FloorballTraining.CoreBusiness;
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
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var result = await db.Activities
                //.Include(a => a.ActivityAgeGroups).ThenInclude(aag => aag.AgeGroup)
                //.Include(a => a.ActivityEquipments).ThenInclude(ae => ae.Equipment)
                //.Include(a => a.ActivityMedium)
                //.Include(a => a.ActivityTags).ThenInclude(at => at.Tag)
                .Where(t =>

                criteria == new SearchCriteria() //nejsou zadna kriteria=>chci vybrat vse

                || (!criteria.DurationMin.HasValue || (criteria.DurationMin.HasValue && t.DurationMin >= criteria.DurationMin)
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

            SetActivityAgeGroupsAsUnchanged(activity, db);

            SetTrainingGroupActivitiesAsUnchanged(activity, db);

            SetActivityEquipmentsAsUnchanged(activity, db);

            SetActivityMediumAsUnchanged(activity, db);

            SetActivityTagsAsUnchanged(activity, db);


            await db.SaveChangesAsync();


        }

        private void SetActivityTagsAsUnchanged(Activity activity, FloorballTrainingContext floorballTrainingContext)
        {

            if (activity.ActivityTags.Any())
            {
                foreach (var activityTag in activity.ActivityTags)
                {
                    if (activityTag.Tag != null) floorballTrainingContext.Entry(activityTag.Tag).State = EntityState.Unchanged;
                }
            }
        }

        private void SetActivityMediumAsUnchanged(Activity activity, FloorballTrainingContext floorballTrainingContext)
        {
            if (activity.ActivityMedium.Any())
            {
                foreach (var activityMedia in activity.ActivityMedium)
                {
                    if (activityMedia.Media?.MediaId > 0)
                    {
                        floorballTrainingContext.Entry(activityMedia.Media).State = EntityState.Unchanged;
                    }
                    else if (activityMedia.Media?.MediaId == 0)
                    {
                        floorballTrainingContext.Medium.Add(activityMedia.Media!);
                    }
                }
            }
        }

        private void SetActivityEquipmentsAsUnchanged(Activity activity,
            FloorballTrainingContext floorballTrainingContext)
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

        private void SetTrainingGroupActivitiesAsUnchanged(Activity activity,
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

        private void SetActivityAgeGroupsAsUnchanged(Activity activity,
            FloorballTrainingContext floorballTrainingContext)
        {
            if (activity.ActivityAgeGroups.Any())
            {
                foreach (var activityActivityAge in activity.ActivityAgeGroups)
                {
                    floorballTrainingContext.Entry(activityActivityAge.AgeGroup).State = EntityState.Unchanged;
                }
            }
        }

        public async Task<Activity> GetActivityByIdAsync(int activityId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var re = await db.Activities.Where(a => a.ActivityId == activityId)
                .Include(a => a.ActivityAgeGroups).ThenInclude(t => t.AgeGroup)
                .Include(a => a.ActivityEquipments)//!.ThenInclude(t => t.Equipment)
                .Include(a => a.ActivityMedium)//!.ThenInclude(t => t.Media)
                .Include(a => a.ActivityTags)//!.ThenInclude(t => t.Tag)
                                             //.AsNoTracking()
                .AsSingleQuery()
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
                .Include(a => a.ActivityAgeGroups).ThenInclude(g => g.AgeGroup)
                //.Include(a => a.ActivityEquipments)!.ThenInclude(t => t.Equipment)
                //.Include(a => a.ActivityMedium)!.ThenInclude(t => t.Media)
                //.Include(a => a.ActivityTags)!.ThenInclude(t => t.Tag)
                //.AsNoTracking()
                //.AsSingleQuery()
                .First();

            //if (existingActivity == null) return;



            db.Entry(existingActivity).CurrentValues.SetValues(activity);




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

            foreach (var existingActivityAgeGroup in existingActivity.ActivityAgeGroups.Where(a => a.ActivityAgeGroupId > 0).ToList())
            {
                var isExisting = activity.ActivityAgeGroups.Any(p => p.AgeGroupId == existingActivityAgeGroup.AgeGroupId);

                if (!isExisting)
                {
                    existingActivity.ActivityAgeGroups.Remove(existingActivityAgeGroup);
                    db.Entry(existingActivity).State = EntityState.Unchanged;

                }
            }










            //SetActivityAgeGroupsAsUnchanged(existingActivity, db);


            //SetTrainingGroupActivitiesAsUnchanged(activity, db);

            //SetActivityEquipmentsAsUnchanged(activity, db);

            //SetActivityMediumAsUnchanged(activity, db);

            //SetActivityTagsAsUnchanged(activity, db);



            db.SaveChanges();

        }


    }
}