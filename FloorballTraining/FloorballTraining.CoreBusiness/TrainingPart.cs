using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class TrainingPart
    {
        [Key]
        [Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TrainingPartId { get; set; }

        public string? Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int Duration { get; set; } = 1;

        public int Order { get; set; }

        public Training Training { get; set; } = null!;
        public int TrainingId { get; set; }

        public List<TrainingGroup>? TrainingGroups { get; set; } = new();

        public TrainingPart Clone()
        {
            return new TrainingPart
            {
                TrainingPartId = this.TrainingPartId,
                Name = Name,
                Description = Description,
                Duration = Duration,
                Order = Order,
                TrainingGroups = TrainingGroups,
                Training = Training,
                TrainingId = TrainingId
            };
        }

        public void Merge(TrainingPart other)
        {
            Name = other.Name;
            Description = other.Description;
            Duration = other.Duration;
            Order = other.Order;
            TrainingGroups = other.TrainingGroups;
            Training = other.Training;
            TrainingId = other.TrainingId;
        }
    }
}
