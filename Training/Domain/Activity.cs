using System.Collections.Generic;

namespace Domain
{
    public class Activity
    {
        public int Id;
        public string Name { get; set; }
        public string Description { get; set; }
        public double Rating { get; set; }
        public int Duration { get; set; }
        public int PersonsMin { get; set; }
        public int PersonsMax { get; set; }


        public List<Aid> Aids { get; set; }
        public List<Aim> Aims { get; set; }
        public List<ActivityType> ActivityTypes { get; set; }
        public List<Training> Trainings { get; set; }

        public string FullInfo => $"{Name}";


    }
}
