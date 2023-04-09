using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Activity
    {
        [Key]
        public int ActivityId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        [Range(1, 100)]
        public int? PersonsMin { get; set; }
        [Range(1, 100)]
        public int? PersonsMax { get; set; }
        [Range(1, 180)]
        public int? DurationMin { get; set; }
        [Range(1, 180)]
        public int? DurationMax { get; set; }


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

    }
}