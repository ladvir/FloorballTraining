using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class TrainingGroup
    {
        [Key]
        [Required]
        public int TrainingGroupId { get; set; }

        public string? Name { get; set; } = string.Empty;

        public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new List<TrainingGroupActivity>();

        public TrainingGroup Clone()
        {
            return new TrainingGroup
            {
                TrainingGroupId = this.TrainingGroupId,
                Name = Name
            };
        }

        public void Merge(TrainingGroup other)
        {
            Name = other.Name;
            TrainingGroupActivities = other.TrainingGroupActivities;
        }
    }
}
