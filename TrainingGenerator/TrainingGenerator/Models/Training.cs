using System.Collections.Generic;

namespace TrainingGenerator.Models
{
    public class Training
    {
        private readonly List<Activity> _activities;

        public Training(List<Activity> activities)
        {
            _activities = activities;
        }

        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? Note { get; set; }
        public double? Rating { get; set; }

        public ICollection<Activity> GetActivities()
        {
            return _activities;
        }

        public void AddActivity(Activity activity)
        {
            _activities.Add(activity);
        }
    }
}