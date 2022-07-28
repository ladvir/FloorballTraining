namespace TrainingGenerator.Models
{
    public class Activity
    {
        public int Id { get; }
        public string Name { get; }
        public string Description { get; }
        public double? Rating { get; }
        public int? Duration { get; }
        public int? PersonsMin { get; }
        public int? PersonsMax { get; }

        public Activity(string name, string description, double? rating, int? duration, int? personsMin, int? personsMax)
        {
            Name = name;
            Description = description;
            Rating = rating;
            Duration = duration;
            PersonsMin = personsMin;
            PersonsMax = personsMax;
        }
    }
}