using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("Trainings", Schema = "dbo")]
    public partial class Training
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string Description { get; set; }

        [Required]
        public int Duration { get; set; }

        [Required]
        public int PersonsMin { get; set; }

        [Required]
        public int PersonsMax { get; set; }

        [Required]
        public int Intensity { get; set; }

        [Required]
        public int Difficulty { get; set; }

        public string CommentBefore { get; set; }

        public string CommentAfter { get; set; }

        [Required]
        public int PlaceId { get; set; }

        public Place Place { get; set; }

        public int? TrainingGoal1Id { get; set; }

        public Tag Tag { get; set; }

        public int? TrainingGoal2Id { get; set; }

        public Tag Tag1 { get; set; }

        public int? TrainingGoal3Id { get; set; }

        public Tag Tag2 { get; set; }

        public int GoaliesMax { get; set; }

        public int GoaliesMin { get; set; }

        public ICollection<Appointment> Appointments { get; set; }

        public ICollection<TrainingAgeGroup> TrainingAgeGroups { get; set; }

        public ICollection<TrainingPart> TrainingParts { get; set; }
    }
}