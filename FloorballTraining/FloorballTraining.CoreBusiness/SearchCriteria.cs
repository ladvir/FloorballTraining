namespace FloorballTraining.CoreBusiness
{
    public class SearchCriteria
    {
        public int? DurationMin { get; set; }

        public int? DurationMax { get; set; }


        public int? PersonsMax { get; set; }


        public int? PersonsMin { get; set; }


        public int? IntensityMax { get; set; } = Intensities.MaxValue;


        public int? IntensityMin { get; set; } = Intensities.MinValue;


        public int? DifficultyMax { get; set; } = Difficulties.MaxValue;


        public int? DifficultyMin { get; set; } = Difficulties.MinValue;


        public List<AgeGroup> AgeGroups { get; set; } = new();

        public List<Tag> Tags { get; set; } = new();


        public string Text { get; set; } = string.Empty;
    }
}
