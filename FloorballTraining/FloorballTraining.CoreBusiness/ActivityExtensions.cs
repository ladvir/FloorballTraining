namespace FloorballTraining.CoreBusiness
{
    public static class ActivityExtensions
    {
        public static Activity Clone(this Activity existingActivity)
        {
            var clone = new Activity
            {
                ActivityId = existingActivity.ActivityId,
                Name = existingActivity.Name,
                Description = existingActivity.Description,
                DurationMin = existingActivity.DurationMin,
                DurationMax = existingActivity.DurationMax,
                PersonsMin = existingActivity.PersonsMin,
                PersonsMax = existingActivity.PersonsMax,
                ActivityTags = existingActivity.ActivityTags
            };

            return clone;
        }

        public static void Merge(this Activity existingActivity, Activity activity)
        {
            existingActivity.Name = activity.Name;
            existingActivity.Description = activity.Description;
            existingActivity.DurationMin = activity.DurationMin;
            existingActivity.DurationMax = activity.DurationMax;
            existingActivity.PersonsMin = activity.PersonsMin;
            existingActivity.PersonsMax = activity.PersonsMax;
            existingActivity.ActivityTags = activity.ActivityTags;
        }
    }
}
