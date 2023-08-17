using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Training
    {
        [Key]
        [Required]
        public int TrainingId { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;
        
        public int Duration { get; set; } = 1;

        public int PersonsMin { get; set; } = 1;
        public int PersonsMax { get; set; } 

        public Tag? TrainingGoal { get; set; } 

        public string? CommentBefore { get; set; } = string.Empty;
        public string? CommentAfter { get; set; } = string.Empty;
        
        public List<TrainingPart> TrainingParts { get; set; } = new List<TrainingPart>();
        public Training Clone()
        {
            return new Training
            {
                TrainingId = TrainingId,
                Name = Name,
                Description = Description,
                Duration = Duration,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                TrainingGoal = TrainingGoal,
                CommentBefore = CommentBefore,
                CommentAfter = CommentAfter
            };
        }

        public void Merge(Training other)
        {
            Name = other.Name;
            Description = other.Description;
            Duration = other.Duration;
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            TrainingGoal = other.TrainingGoal;
            TrainingParts = other.TrainingParts;
            CommentBefore = other.CommentBefore;
            CommentAfter = other.CommentAfter;
        }

        public List<string?> GetEquipment()
        {
            return TrainingParts.SelectMany(tp => tp.TrainingGroups)
                .SelectMany(tg => tg.TrainingGroupActivities).Where(tga => tga.Activity != null).Select(tga => tga.Activity!).Where(a => a.ActivityEquipments.Any()).AsEnumerable()
                .SelectMany(a => a.ActivityEquipments).Select(ae => ae.Equipment?.Name).Distinct().ToList();
        }

        public int GetActivitiesDuration()
        {
            if (TrainingParts.Sum(tp => tp.TrainingGroups.Count) == 0) return 0;

            return TrainingParts.Sum(t => t.TrainingGroups.Max(tg => tg.TrainingGroupActivities.Sum(tga => tga.Duration)));
        }

        public int GetTrainingGoalActivitiesDuration()
        {
            if (TrainingParts.Sum(tp => tp.TrainingGroups.Count) == 0) return 0;

            return TrainingParts.Sum(t => t.TrainingGroups.Max(tg => tg.TrainingGroupActivities.Where(tga=>tga.Activity!.ActivityTags.Any(tag=>tag.TagId==TrainingGoal?.TagId)).Sum(tga => tga.Duration)));
        }
    }
}
