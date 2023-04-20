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

        public int Duration { get; set; } = 90;

        public int PersonsMin { get; set; } = 10;
        public int PersonsMax { get; set; } = 25;


        public List<TrainingPart> TrainingParts { get; set; } = new List<TrainingPart>();
        public Training Clone()
        {
            return new Training
            {
                TrainingId = this.TrainingId,
                Name = Name,
                Description = Description,
                Duration = Duration,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax
            };
        }

        public void Merge(Training other)
        {
            Name = other.Name;
            Description = other.Description;
            Duration = other.Duration;
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            TrainingParts = other.TrainingParts;
        }

        public List<string?> GetEquipment()
        {
            return TrainingParts.SelectMany(tp => tp.TrainingGroups)
                .SelectMany(tg => tg.TrainingGroupActivities).Select(tga => tga.Activity).AsEnumerable()
                .SelectMany(a => a.ActivityTags).Where(t => t.Tag?.ParentTag?.Name == "Vybavení").Select(t => t.Tag?.Name).Distinct().ToList();

        }
    }
}
