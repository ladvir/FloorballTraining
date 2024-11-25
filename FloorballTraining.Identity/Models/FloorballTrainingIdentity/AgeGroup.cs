using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("AgeGroups", Schema = "dbo")]
    public partial class AgeGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Description { get; set; }

        public ICollection<ActivityAgeGroup> ActivityAgeGroups { get; set; }

        public ICollection<Team> Teams { get; set; }

        public ICollection<TrainingAgeGroup> TrainingAgeGroups { get; set; }
    }
}