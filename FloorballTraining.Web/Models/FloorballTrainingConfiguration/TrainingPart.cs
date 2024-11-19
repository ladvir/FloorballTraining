using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("TrainingParts", Schema = "dbo")]
    public partial class TrainingPart
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
        public int Order { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int TrainingId { get; set; }

        public Training Training { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Duration { get; set; }

        public ICollection<TrainingGroup> TrainingGroups { get; set; }
    }
}