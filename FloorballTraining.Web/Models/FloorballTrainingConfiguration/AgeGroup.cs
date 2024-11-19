using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("AgeGroups", Schema = "dbo")]
    public partial class AgeGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Name { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Description { get; set; }

        public ICollection<ActivityAgeGroup> ActivityAgeGroups { get; set; }

        public ICollection<Team> Teams { get; set; }

        public ICollection<TrainingAgeGroup> TrainingAgeGroups { get; set; }
    }
}