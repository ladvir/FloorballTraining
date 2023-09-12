namespace FloorballTraining.CoreBusiness
{
    //[PrimaryKey(nameof(TrainingPartId), nameof(TrainingGroupId))]
    public class TrainingGroup
    {
        public int TrainingGroupId { get; set; }

        public string? Name { get; set; } = string.Empty;

        public int PersonsMax { get; set; } = 30;

        public int PersonsMin { get; set; } = 1;

        public List<TrainingGroupActivity> TrainingGroupActivities { get; set; } = new();

        public TrainingPart TrainingPart { get; set; } = null!;
        //public int TrainingPartId { get; set; }

        public TrainingGroup Clone()
        {
            return new TrainingGroup
            {
                TrainingGroupId = TrainingGroupId,
                Name = Name,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                TrainingGroupActivities = TrainingGroupActivities,
                TrainingPart = TrainingPart,
                //TrainingPartId = TrainingPartId

            };
        }

        public void Merge(TrainingGroup other)
        {
            Name = other.Name;
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            TrainingGroupActivities = other.TrainingGroupActivities;
            TrainingPart = other.TrainingPart;
            //TrainingPartId = other.TrainingPartId;
        }
    }
}
