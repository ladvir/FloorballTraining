using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models
{
    [Table("Activities")]
    public class Activity
    {
        [Key]
        [Required]
        public int ActivityId { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public int? PersonsMin { get; set; }
        public int? PersonsMax { get; set; }
        public int? DurationMin { get; set; }
        public int? DurationMax { get; set; }
        public List<Tag> Tags { get; set; }


        public List<TrainingPart> TrainingParts { get; set; }

        /* EF Relations */
        public List<ActivityTag> ActivityTags { get; set; }
        public List<TrainingPartActivity> TrainingPartActivities { get; set; }



        public Activity()
        {
        }


        public Activity(Activity activity)
        {
            ActivityId = activity.ActivityId;
            Name = activity.Name;
            Description = activity.Description;
            PersonsMax = activity.PersonsMax;
            Tags = new List<Tag>(activity.Tags);
            PersonsMin = activity.PersonsMin;
            DurationMin = activity.DurationMin;
            DurationMax = activity.DurationMax;
        }
    }
}