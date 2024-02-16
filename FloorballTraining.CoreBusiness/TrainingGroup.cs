namespace FloorballTraining.CoreBusiness
{
    public class TrainingGroup : BaseEntity
    {
        public int PersonsMax { get; set; } = 30;

        public int PersonsMin { get; set; } = 1;

        public Activity? Activity { get; set; }
        public int? ActivityId { get; set; }


        public TrainingPart TrainingPart { get; set; } = null!;
        public int TrainingPartId { get; set; }


        public TrainingGroup Clone()
        {
            return new TrainingGroup
            {
                Id = Id,
                PersonsMin = PersonsMin,
                PersonsMax = PersonsMax,
                TrainingPart = TrainingPart,
                TrainingPartId = TrainingPartId,
                Activity = Activity,
                ActivityId = ActivityId
            };
        }

        public void Merge(TrainingGroup other)
        {
            PersonsMin = other.PersonsMin;
            PersonsMax = other.PersonsMax;
            Activity = other.Activity;
            TrainingPart = other.TrainingPart;
            TrainingPartId = other.TrainingPartId;
            ActivityId = other.ActivityId;
        }
    }
}