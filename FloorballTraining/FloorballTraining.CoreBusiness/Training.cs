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


        public Tag? TrainingGoal { get; set; }

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
                Order = TrainingParts.Any() ? TrainingParts.Max(tp => tp.Order) : 0 + 1,
                TrainingGroups = new List<TrainingGroup>
                {
                    new()
                    {
                        PersonsMax = PersonsMax
                    }
                }
            });
        }

        public List<string?> GetEquipment()
        {

            var x = TrainingParts.SelectMany(tp => tp.TrainingGroups)
                .SelectMany(tg => tg.TrainingGroupActivities);

            var y = x.Where(tga => tga.Activity != null).Select(tga => tga.Activity!);

            var z = y.Where(a => a.ActivityEquipments.Any()).AsEnumerable().SelectMany(a => a.ActivityEquipments);
                
                var zz = z.Select(ae => ae.Equipment?.Name).Distinct().ToList();

                return zz;
        }

        public int GetActivitiesDuration()
        {
            return TrainingParts.Sum(t => t.Duration);
        }

        public int GetTrainingGoalActivitiesDuration()
        {
            if (TrainingParts.Sum(tp => tp.TrainingGroups.Count) == 0) return 0;

            if (TrainingGoal == null) return 0;

            //return TrainingParts.Sum(t => t.TrainingGroups.Any() ? t.TrainingGroups.Max(tg => tg.TrainingGroupActivities
            //    .Where(tga => tga.Activity != null && tga.Activity.ActivityTags.Any(tag => tag.TagId == TrainingGoal.TagId))
            //    .Sum(tga => tga.Duration)) : 0);

            var trainingPartsWithTrainingGoal = TrainingParts.Where(tp=>
                    tp.TrainingGroups.Any(tga => 
                        tga.TrainingGroupActivities.Any(a=>
                            a.Activity != null && a.Activity.ActivityTags.Any(tag => 
                                tag.TagId == TrainingGoal.TagId)))).Sum(tp=>tp.Duration);

            return trainingPartsWithTrainingGoal;
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

        public List<Activity> GetActivities()
        {
            return TrainingParts.SelectMany(tp => tp.TrainingGroups)
                .SelectMany(tg => tg.TrainingGroupActivities)
                .Where(tga => tga.Activity != null)
                .Select(tga => tga.Activity!).ToList();
        }
    }
}
