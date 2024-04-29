namespace FloorballTraining.CoreBusiness
{
    public class AgeGroup : BaseEntity
    {
        public const string AnyAge = "Kdokoliv";

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public List<ActivityAgeGroup> ActivityAgeGroups { get; set; } = new();

        public List<TrainingAgeGroup> TrainingAgeGroups { get; set; } = new();

        public List<Team> Teams { get; set; } = new();

        public bool IsAnyAge()
        {
            return Name == AnyAge;
        }

    }
}