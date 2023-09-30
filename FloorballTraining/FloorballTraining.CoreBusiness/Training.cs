using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class Training
    {
        [Key]
        [Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TrainingId { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int Duration { get; set; } = 1;

        public int PersonsMin { get; set; } = 1;
        public int PersonsMax { get; set; }

        public int Intesity { get; set; }

        public int Difficulty { get; set; }


        public string? CommentBefore { get; set; } = string.Empty;
        public string? CommentAfter { get; set; } = string.Empty;


        public Tag TrainingGoal { get; set; } = null!;

        public int TrainingGoalId { get; set; }

        public List<TrainingAgeGroup> TrainingAgeGroups { get; set; } = new();

        public List<TrainingPart> TrainingParts { get; set; } = new();

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
                TrainingGoalId = TrainingGoalId,
                Difficulty = Difficulty,
                Intesity = Intesity,
                CommentBefore = CommentBefore,
                CommentAfter = CommentAfter,
                TrainingParts = TrainingParts,
                TrainingAgeGroups = TrainingAgeGroups
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
            TrainingGoalId = other.TrainingGoalId;
            Difficulty = other.Difficulty;
            Intesity = other.Intesity;
            TrainingParts = other.TrainingParts;
            CommentBefore = other.CommentBefore;
            CommentAfter = other.CommentAfter;
            TrainingAgeGroups = other.TrainingAgeGroups;
        }

        public void AddTrainingPart(TrainingPart trainingPart)
        {
            TrainingParts.Add(trainingPart);
        }

        public void AddTrainingPart()
        {
            AddTrainingPart(
            new TrainingPart
            {
                Name = $"{TrainingParts.Count + 1}",
                Order = TrainingParts.Count + 1,
                TrainingGroups = new List<TrainingGroup>
                {
                    new()
                    {
                        Name = "Skupina č.1",
                        PersonsMax = PersonsMax
                    }
                }
            });
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

            return TrainingParts.Sum(t => t.TrainingGroups.Max(tg => tg.TrainingGroupActivities.Any() ? tg.TrainingGroupActivities.Sum(tga => tga.Duration) : 0));
        }

        public int GetTrainingGoalActivitiesDuration()
        {
            if (TrainingParts.Sum(tp => tp.TrainingGroups.Count) == 0) return 0;

            return TrainingParts.Sum(t => t.TrainingGroups.Max(tg => tg.TrainingGroupActivities.Where(tga => tga.Activity!.ActivityTags.Any(tag => tag.TagId == TrainingGoal?.TagId)).Sum(tga => tga.Duration)));
        }

        public void AddAgeGroup(AgeGroup ageGroup)
        {
            if (TrainingAgeGroups.All(at => at.AgeGroup != ageGroup))
            {
                TrainingAgeGroups.Add(new TrainingAgeGroup
                {
                    Training = this,
                    TrainingId = TrainingId,
                    AgeGroup = ageGroup,
                    AgeGroupId = ageGroup.AgeGroupId
                });
            }
        }

        public IOrderedEnumerable<string?> GetAgeGroupNames()
        {
            return TrainingAgeGroups.Select(ae => ae.AgeGroup?.Description).OrderBy(d => d);


        }
    }
}
