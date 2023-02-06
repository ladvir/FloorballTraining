using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models
{
    [Table("Trainings")]
    public class Training
    {



        [Key]
        [Required]
        public int TrainingId { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public int Duration { get; set; }

        public string Place { get; set; }

        public int CoachCount { get; set; }

        public int Persons { get; set; }

        /*EF core relationship*/
        public List<TrainingPart> TrainingParts { get; set; }

        public List<TrainingTrainingPart> TrainingTrainingParts { get; set; }


        public Training()
        {
        }

        public Training(Training training)
        {
            TrainingId = training.TrainingId;
            Name = training.Name;
            CoachCount = training.CoachCount;
            Description = training.Description;
            Duration = training.Duration;
            Persons = training.Persons;
            Place = training.Place;
            TrainingParts = training.TrainingParts;
        }

    }



}
