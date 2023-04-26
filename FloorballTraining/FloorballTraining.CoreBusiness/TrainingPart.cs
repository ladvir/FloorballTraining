using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class TrainingPart
    {
        [Key]
        [Required]
        public int TrainingPartId { get; set; }

        public string? Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int Duration { get; set; } = 1;

        public int Order { get; set; }


        public List<TrainingGroup> TrainingGroups { get; set; } = new List<TrainingGroup>();

        public TrainingPart Clone()
        {
            return new TrainingPart
            {
                TrainingPartId = this.TrainingPartId,
                Name = Name,
                Description = Description,
                Duration = Duration,
                Order = Order,
                TrainingGroups = TrainingGroups
            };
        }

        public void Merge(TrainingPart other)
        {
            Name = other.Name;
            Description = other.Description;
            Duration = other.Duration;
            Order = other.Order;
            TrainingGroups = other.TrainingGroups;
        }
    }
}
