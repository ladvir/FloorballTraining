namespace TrainingDataAccess.Models
{
    public class TrainingGroupActivity
    {

        public int ActivityId { get; set; }
        public Activity Activity { get; set; } = null!;

        public int TrainingGroupId { get; set; }
        public TrainingGroup TrainingGroup { get; set; } = null!;
    }
}