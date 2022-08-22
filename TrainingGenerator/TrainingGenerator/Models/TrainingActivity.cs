namespace TrainingGenerator.Models
{
    public class TrainingActivity
    {
        public int Id { get; set; }
        public int TreninkId { get; set; }
        public int ActivityId { get; set; }
        public int Order { get; set; }
        public int DurationMin { get; set; }
        public int DurationMax { get; set; }
    }
}