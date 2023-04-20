using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Activity
    {
        [Key]
        [Required]
        public int ActivityId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;

        public int PersonsMin { get; set; } = 1;

        public int PersonsMax { get; set; } = 50;

        public int DurationMin { get; set; } = 1;
        public int DurationMax { get; set; } = 180;


        public List<ActivityTag> ActivityTags { get; set; } = new List<ActivityTag>();


        public void AddTag(Tag tag)
        {
            if (!ActivityTags.Any(at => at.Tag != null && at.Tag?.TagId == tag.TagId))
            {
                ActivityTags.Add(new ActivityTag
                {
                    TagId = tag.TagId,
                    Tag = tag,
                    ActivityId = this.ActivityId,
                    Activity = this
                });
            }
        }

        public Activity Clone()
        {
            return new Activity
            {
                ActivityId = this.ActivityId,
                Name = Name,
                Description = Description,
                DurationMin = DurationMin,
                DurationMax = DurationMax,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                ActivityTags = ActivityTags
            };
        }

        public void Merge(Activity activity)
        {
            Name = activity.Name;
            Description = activity.Description;
            DurationMin = activity.DurationMin;
            DurationMax = activity.DurationMax;
            PersonsMin = activity.PersonsMin;
            PersonsMax = activity.PersonsMax;
            ActivityTags = activity.ActivityTags;
        }

    }
}