namespace TrainingDataAccess.Models
{
    public class ActivityTag
    {

        public int ActivityId { get; set; }
        public Activity Activity { get; set; } = null!;

        public int TagId { get; set; }
        public Tag Tag { get; set; } = null!;

        public ActivityTag Create(Activity activity, Tag tag)
        {
            var activityTag = new ActivityTag();

            activityTag.Initialize(activity, tag);

            return activityTag;
        }


        public void Initialize(int activityId, int tagId)
        {

            ActivityId = activityId;
            TagId = tagId;
        }

        public void Initialize(Activity activity, Tag tag)
        {
            Activity = activity;
            Tag = tag;
            ActivityId = activity.ActivityId;
            TagId = tag.TagId;
        }
    }
}