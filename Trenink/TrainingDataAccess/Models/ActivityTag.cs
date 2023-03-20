namespace TrainingDataAccess.Models
{
    public class ActivityTag
    {

        public int ActivityId { get; set; }
        public Activity Activity { get; set; } = null!;

        public int TagId { get; set; }
        public Tag Tag { get; set; } = null!;
    }
}