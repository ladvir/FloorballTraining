/*namespace TrainingDataAccess.Dtos
{
    public class TrainingDto
    {
        public int TrainingId { get; set; }

        public string Name { get; set; }

        public string? Description { get; set; }

        public int Duration { get; set; }

        public string? Place { get; set; }

        public int Persons { get; set; }


        public List<TrainingPartDto> TrainingParts { get; set; } = new List<TrainingPartDto>();

        public TrainingDto()
        {
        }


        public TrainingDto(string name)
        {
            Name = name;
        }
        public TrainingDto(TrainingDto training)
        {
            TrainingId = training.TrainingId;
            Name = training.Name;
            Description = training.Description;
            Duration = training.Duration;
            Persons = training.Persons;
            Place = training.Place;
            TrainingParts = training.TrainingParts;
        }

        public void SetValuesBasedOnActivities()
        {
            Duration = TrainingParts.Sum(tp => tp.Activities.Sum(a => a.DurationMax.GetValueOrDefault(0)));
            Persons = TrainingParts.Sum(tp => tp.Activities.Min(a => a.PersonsMax.GetValueOrDefault(999)));
        }
    }



}*/
