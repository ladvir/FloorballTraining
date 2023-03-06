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

        public string? Description { get; set; }

        public int Duration { get; set; }

        public string? Place { get; set; }

        public int Persons { get; set; }

        /*EF core relationship*/
        public List<TrainingPart> TrainingParts { get; set; } = new List<TrainingPart>();

        public List<TrainingTrainingPart> TrainingTrainingParts { get; set; } = new List<TrainingTrainingPart>();


        public Training()
        {
        }


        public Training(string name)
        {
            Name = name;
        }
        public Training(Training training)
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
            this.Duration = TrainingParts.Sum(tp => tp.Activities.Sum(a => a.DurationMax.GetValueOrDefault(0)));
            this.Persons = TrainingParts.Sum(tp => tp.Activities.Min(a => a.PersonsMax.GetValueOrDefault(999)));
        }
    }



}
