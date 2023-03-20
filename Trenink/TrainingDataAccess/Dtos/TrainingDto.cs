namespace TrainingDataAccess.Dtos
{
    public class TrainingDto
    {
        public int TrainingId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int Duration { get; set; }


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
            TrainingParts = training.TrainingParts;
        }


    }
}

