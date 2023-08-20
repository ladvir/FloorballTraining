using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class TrainingGroup
    {
        [Key]
        [Required]
        public int TrainingGroupId { get; set; }

        public string? Name { get; set; } = string.Empty;

        public int PersonsMax { get; set; }

        public int PersonsMin { get; set; }

        public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new();
        

        public TrainingGroup Clone()
        {
            return new TrainingGroup
            {
                TrainingGroupId = TrainingGroupId,
                Name = Name,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                TrainingGroupActivities = TrainingGroupActivities
            };
        }

        public void Merge(TrainingGroup other)
        {
            Name = other.Name;
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            TrainingGroupActivities = other.TrainingGroupActivities;
        }
    }
}
