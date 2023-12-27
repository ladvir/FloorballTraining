using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness
{
    public class SearchCriteria
    {
        public List<int> Ids { get; set; } = new();
        public int? DurationMin { get; set; }

        public int? DurationMax { get; set; }


        public int? PersonsMax { get; set; }


        public int? PersonsMin { get; set; }


        public int? IntensityMax { get; set; } = Intensities.MaxValue;


        public int? IntensityMin { get; set; } = Intensities.MinValue;


        public int? DifficultyMax { get; set; } = Difficulties.MaxValue;


        public int? DifficultyMin { get; set; } = Difficulties.MinValue;


        public List<AgeGroup> AgeGroups { get; set; } = new();

        public List<TagDto> Tags { get; set; } = new();


        public List<PlaceDto> Places { get; set; } = new();

        public string Text { get; set; } = string.Empty;
    }
}
