﻿namespace FloorballTraining.CoreBusiness.Dtos
{
    public class SearchCriteria
    {
        public List<int> Ids { get; set; } = new();
        public int? DurationMin { get; set; }

        public int? DurationMax { get; set; }


        public int? PersonsMax { get; set; }


        public int? PersonsMin { get; set; }
        public int? GoaliesMax { get; set; }


        public int? GoaliesMin { get; set; }


        public int? IntensityMax { get; set; } = Intensities.MaxValue;


        public int? IntensityMin { get; set; } = Intensities.MinValue;


        public int? DifficultyMax { get; set; } = Difficulties.MaxValue;


        public int? DifficultyMin { get; set; } = Difficulties.MinValue;

        public int? PlaceAreaMin { get; set; }

        public int? PlaceAreaMax { get; set; }

        public int? PlaceLengthMin { get; set; }
        public int? PlaceLengthMax { get; set; }
        public int? PlaceWidthMin { get; set; }
        public int? PlaceWidthMax { get; set; }

        public string Text { get; set; } = string.Empty;


        public List<AgeGroupDto> AgeGroups { get; set; } = new();

        public List<TagDto?> Tags { get; set; } = new();


        public List<PlaceDto> Places { get; set; } = new();


    }
}
