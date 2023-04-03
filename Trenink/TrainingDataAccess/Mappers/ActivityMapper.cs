using TrainingDataAccess.Dtos;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Mappers
{


    public static class ActivityMapper
    {
        public static IQueryable<ActivityDto> MapToActivityDto(this IQueryable<Activity> activities)
        {
            return activities.Select(a => new ActivityDto
            {
                ActivityId = a.ActivityId,
                Name = a.Name,
                Description = a.Description,
                DurationMin = a.DurationMin,
                DurationMax = a.DurationMax,
                PersonsMin = a.PersonsMin,
                PersonsMax = a.PersonsMax,
                AcitvityTags = a.ActivityTags.Select(at => at.MapToActivityTagDto()).ToList()
            });
        }



        public static ActivityDto MapToActivityDto(this Activity activity)
        {
            return new ActivityDto
            {
                ActivityId = activity.ActivityId,
                Name = activity.Name,
                Description = activity.Description,
                DurationMin = activity.DurationMin,
                DurationMax = activity.DurationMax,
                PersonsMin = activity.PersonsMin,
                PersonsMax = activity.PersonsMax,
                AcitvityTags = activity.ActivityTags.Select(at => at.MapToActivityTagDto()).ToList()
            };
        }

        public static IQueryable<ActivityOverviewDto> MapToActivityOverviewDto(this IQueryable<Activity> activities)
        {
            return activities.Select(a => new ActivityOverviewDto
            {
                ActivityId = a.ActivityId,
                Name = a.Name,
                Description = a.Description,
                DurationMin = a.DurationMin,
                DurationMax = a.DurationMax,
                PersonsMin = a.PersonsMin,
                PersonsMax = a.PersonsMax,
                Tags = a.ActivityTags.Select(at => at.Tag.MapToTagDto()).ToList()
            });
        }

        public static ActivityOverviewDto MapToActivityOverviewDto(this Activity activity)
        {
            return new ActivityOverviewDto
            {
                ActivityId = activity.ActivityId,
                Name = activity.Name,
                Description = activity.Description,
                DurationMin = activity.DurationMin,
                DurationMax = activity.DurationMax,
                PersonsMin = activity.PersonsMin,
                PersonsMax = activity.PersonsMax,
                Tags = activity.ActivityTags.Select(at => at.Tag.MapToTagDto()).ToList()
            };
        }


        public static ActivityOverviewDto MapToActivityOverviewDto(this ActivityDto activity)
        {
            return new ActivityOverviewDto
            {
                ActivityId = activity.ActivityId,
                Name = activity.Name,
                Description = activity.Description,
                DurationMin = activity.DurationMin,
                DurationMax = activity.DurationMax,
                PersonsMin = activity.PersonsMin,
                PersonsMax = activity.PersonsMax,
                Tags = activity.AcitvityTags.Select(t => t.Tag).ToList()
            };
        }

        public static ActivityDto MapToActivityDto(this ActivityOverviewDto activity)
        {
            var activityTags = new List<ActivityTagDto>();

            foreach (var tag in activity.Tags)
            {
                activityTags.Add(new ActivityTagDto
                {
                    ActivityId = activity.ActivityId,
                    TagId = tag.TagId,
                    Tag = tag
                });
            }

            return new ActivityDto
            {
                ActivityId = activity.ActivityId,
                Name = activity.Name,
                Description = activity.Description,
                DurationMin = activity.DurationMin,
                DurationMax = activity.DurationMax,
                PersonsMin = activity.PersonsMin,
                PersonsMax = activity.PersonsMax,
                AcitvityTags = activityTags
            };
        }
    }
}

