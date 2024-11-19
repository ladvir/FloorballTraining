using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("Activities", Schema = "dbo")]
    public partial class Activity
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
        public int PersonsMin { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int PersonsMax { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int GoaliesMin { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int GoaliesMax { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int DurationMin { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int DurationMax { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Intensity { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Difficulty { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int PlaceWidth { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int PlaceLength { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Environment { get; set; }

        public ICollection<ActivityAgeGroup> ActivityAgeGroups { get; set; }

        public ICollection<ActivityEquipment> ActivityEquipments { get; set; }

        public ICollection<ActivityMedium> ActivityMedia { get; set; }

        public ICollection<ActivityTag> ActivityTags { get; set; }

        public ICollection<TrainingGroup> TrainingGroups { get; set; }
    }
}