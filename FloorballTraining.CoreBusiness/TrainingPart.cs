namespace FloorballTraining.CoreBusiness
{
    public class TrainingPart : BaseEntity
    {
        public string? Name { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;

        public int Order { get; set; }

        public Training? Training { get; set; }
        public int TrainingId { get; set; }

        public int Duration { get; set; }

        public List<TrainingGroup>? TrainingGroups { get; set; }

        public TrainingPart Clone()
        {
            return new TrainingPart
            {
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
            // Update scalar properties
            Name = other.Name;
            Description = other.Description;
            Order = other.Order;
            Duration = other.Duration;

            // Note: We don't update TrainingId or Training navigation property 
            // as we want to preserve the existing relationship

            // Handle TrainingGroups if they exist in the source
            if (other.TrainingGroups == null)
            {
                TrainingGroups = [];
                return;
            }

            // Initialize TrainingGroups if it's null
            TrainingGroups ??= [];

            // Update existing TrainingGroups
            foreach (var otherGroup in other.TrainingGroups)
            {
                var existingGroup = TrainingGroups.FirstOrDefault(g => g.Id == otherGroup.Id);

                if (existingGroup != null)
                {
                    existingGroup.Merge(otherGroup);
                }
                else if (otherGroup.Id > 0)
                {
                    // If the group has an ID but doesn't exist in our list,
                    // it's an existing group that should be added
                    TrainingGroups.Add(otherGroup);
                }
                else
                {
                    // It's a new group, clone it to avoid reference issues
                    var newGroup = otherGroup.Clone();
                    newGroup.TrainingPartId = Id;
                    TrainingGroups.Add(newGroup);
                }
            }

            // Remove groups that are no longer in the source
            foreach (var existingGroup in TrainingGroups.Where(g => g.Id > 0).ToList()
                         .Where(existingGroup => other.TrainingGroups.All(g => g.Id != existingGroup.Id)))
            {
                TrainingGroups.Remove(existingGroup);
            }
        }
    }
}