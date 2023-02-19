using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.ActivityServices
{


    public static class ActivityDtoSelect
    {
        public static IQueryable<ActivityDto>
            MapActivityToDto(this IQueryable<Activity> activities)
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
                TagIds = a.Tags.Select(t => t.TagId.GetValueOrDefault()).ToList()
            }

            );
        }


    }
}

