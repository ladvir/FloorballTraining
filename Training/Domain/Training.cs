using System.Collections.Generic;

namespace Domain
{
    public class Training
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Note { get; set; }
        public float Rating { get; set; }

        public List<Activity> Activitites { get; set; }
    }
}
