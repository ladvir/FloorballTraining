namespace FloorballTraining.CoreBusiness
{
    public class ActivitySearchCriteria
    {
        public int? DurationMin { get; set; }

        public int? DurationMax { get; set; }

        
        public int? PersonsMax { get; set; }

        
        public int? PersonsMin { get; set; }

        
        public List<Tag> Tags { get; set; } = new ();

        
        public string Text { get; set; } = string.Empty;
    }
}
