using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Expressions;
using TrainingDataAccess.Services.ActivityServices;

namespace TrainingDataAccess.Models
{
    [Table("Activities")]
    public partial class Activity
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


        public List<TrainingPart> TrainingParts { get; set; } = new List<TrainingPart>();

        /* EF Relations */
        public List<ActivityTag> ActivityTags { get; set; } = new List<ActivityTag>();
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

        public static Expression<Func<Activity, bool>> ContainsInDescription(
            params string[] keywords)
        {
            var keywordsList = keywords.Where(k => !string.IsNullOrEmpty(k)).ToList();

            var predicate = keywordsList.Any() ? PredicateBuilder.False<Activity>() : PredicateBuilder.True<Activity>();

            foreach (var keyword in keywordsList)
            {
                predicate = predicate.Or(p => p.Name.Contains(keyword));
                predicate = predicate.Or(p => p.Description.Contains(keyword));
                predicate = predicate.Or(p => p.Tags.Any(t => t.Name != null && t.Name.Contains(keyword)));
            }

            return predicate;
        }
    }
}