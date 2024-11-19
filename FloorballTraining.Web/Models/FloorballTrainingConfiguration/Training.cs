using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("Trainings", Schema = "dbo")]
    public partial class Training
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Name { get; set; }

        [ConcurrencyCheck]
        public string Description { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Duration { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int PersonsMin { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int PersonsMax { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Intensity { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Difficulty { get; set; }

        [ConcurrencyCheck]
        public string CommentBefore { get; set; }

        [ConcurrencyCheck]
        public string CommentAfter { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int PlaceId { get; set; }

        public Place Place { get; set; }

        [ConcurrencyCheck]
        public int? TrainingGoal1Id { get; set; }

        public Tag Tag { get; set; }

        [ConcurrencyCheck]
        public int? TrainingGoal2Id { get; set; }

        public Tag Tag1 { get; set; }

        [ConcurrencyCheck]
        public int? TrainingGoal3Id { get; set; }

        public Tag Tag2 { get; set; }

        [ConcurrencyCheck]
        public int GoaliesMax { get; set; }

        [ConcurrencyCheck]
        public int GoaliesMin { get; set; }

        public ICollection<Appointment> Appointments { get; set; }

        public ICollection<TrainingAgeGroup> TrainingAgeGroups { get; set; }

        public ICollection<TrainingPart> TrainingParts { get; set; }
    }
}