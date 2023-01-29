using System.ComponentModel.DataAnnotations;

namespace TrainingDataAccess.Models
{
    public class Activity
    {
        [Key]
        [Required]
        public int ActivityId { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public int? PersonsMin { get; set; }
        public int? PersonsMax { get; set; }

        public List<Tag> Tags { get; set; }

        // public ICollection<ActivityTag> ActivityTags { get; set; }

        public Activity()
        {
            //ActivityId = 0;
            Name = string.Empty;
            Description = string.Empty;
            PersonsMax = 0;
            Tags = new List<Tag>();
            PersonsMin = 0;

            // ActivityTags = new List<ActivityTag>();
        }


        public Activity(Activity activity)
        {
            ActivityId = activity.ActivityId;
            Name = activity.Name;
            Description = activity.Description;
            PersonsMax = activity.PersonsMax;
            Tags = new List<Tag>(activity.Tags);
            PersonsMin = activity.PersonsMin;
            //ActivityTags = activity.ActivityTags;


        }
    }
}