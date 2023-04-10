using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Training
    {
        [Key]
        [Required]
        public int TrainingId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int Duration { get; set; }

        public int Persons { get; set; }


        //public List<TrainingPart> TrainingParts { get; set; } = new List<TrainingPart>();
        public Training Clone()
        {
            return new Training
            {
                TrainingId = this.TrainingId,
                Name = Name,
                Description = Description,
                Duration = Duration,
                Persons = Persons
            };
        }

        public void Merge(Training other)
        {
            Name = other.Name;
            Description = other.Description;
            Duration = other.Duration;
            Persons = other.Persons;
        }
    }
}
