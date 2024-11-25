using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("Activities", Schema = "dbo")]
    public partial class Activity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string Description { get; set; }

        [Required]
        public int PersonsMin { get; set; }

        [Required]
        public int PersonsMax { get; set; }

        [Required]
        public int GoaliesMin { get; set; }

        [Required]
        public int GoaliesMax { get; set; }

        [Required]
        public int DurationMin { get; set; }

        [Required]
        public int DurationMax { get; set; }

        [Required]
        public int Intensity { get; set; }

        [Required]
        public int Difficulty { get; set; }

        [Required]
        public int PlaceWidth { get; set; }

        [Required]
        public int PlaceLength { get; set; }

        [Required]
        public int Environment { get; set; }

        public ICollection<ActivityAgeGroup> ActivityAgeGroups { get; set; }

        public ICollection<ActivityEquipment> ActivityEquipments { get; set; }

        public ICollection<ActivityMedium> ActivityMedia { get; set; }

        public ICollection<ActivityTag> ActivityTags { get; set; }

        public ICollection<TrainingGroup> TrainingGroups { get; set; }
    }
}