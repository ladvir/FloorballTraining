namespace FloorballTraining.WebApp.Data
{
    public class ActivitySearchCriteria
    {
        
        public int? DurationMax { get; set; }

        
        public int? PersonsMax { get; set; }

        
        public int? PersonsMin { get; set; }

        
        public List<int>? TagIds { get; set; } = new ();

        
        public string Text { get; set; } = string.Empty;
    }
}
