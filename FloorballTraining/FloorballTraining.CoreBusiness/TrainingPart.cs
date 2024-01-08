namespace FloorballTraining.CoreBusiness
{
    public class TrainingPart : BaseEntity
    {

        public string? Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int Order { get; set; }

        public Training Training { get; set; } = null!;
        public int TrainingId { get; set; }

        public int Duration { get; set; }

        public List<TrainingGroup> TrainingGroups { get; set; } = null!;

        public TrainingPart Clone()
        {
            return new TrainingPart
            {
                Id = Id,
                Name = Name,
                Description = Description,
                Order = Order,
                TrainingGroups = TrainingGroups,
                Duration = Duration,
                Training = Training,
                TrainingId = TrainingId
            };
        }

        public void Merge(TrainingPart other)
        {
            Name = other.Name;
            Description = other.Description;
            Order = other.Order;
            TrainingGroups = other.TrainingGroups;
            Training = other.Training;
            Duration = other.Duration;
            TrainingId = other.TrainingId;
        }
    }
}