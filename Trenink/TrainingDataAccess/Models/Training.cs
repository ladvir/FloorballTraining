using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models
{
    [Table("TrainingParts")]
    public class TrainingPart
    {
        [Key]
        [Required]
        public int TrainingPartId { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public List<Activity> Activities { get; set; }


        public List<Training> Trainings { get; set; }

        public List<TrainingPartActivity> TrainingPartActivities { get; set; }
        public List<TrainingTrainingPart> TrainingTrainingParts { get; set; }
    }


    public class TrainingPartActivity
    {
        public int TrainingPartId { get; set; }
        public TrainingPart TrainingPart { get; set; }

        public int ActivityId { get; set; }
        public Activity Activity { get; set; }
    }


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

    }


    public class TrainingTrainingPart
    {
        public int TrainingPartId { get; set; }
        public TrainingPart TrainingPart { get; set; }

        public int TrainingId { get; set; }
        public Training Training { get; set; }
    }



}
