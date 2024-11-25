using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("TrainingParts", Schema = "dbo")]
    public partial class TrainingPart
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string Description { get; set; }

        [Required]
        public int Order { get; set; }

        [Required]
        public int TrainingId { get; set; }

        public Training Training { get; set; }

        [Required]
        public int Duration { get; set; }

        public ICollection<TrainingGroup> TrainingGroups { get; set; }
    }
}