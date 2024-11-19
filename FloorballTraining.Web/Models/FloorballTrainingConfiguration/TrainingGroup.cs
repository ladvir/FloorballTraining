using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("TrainingGroups", Schema = "dbo")]
    public partial class TrainingGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int PersonsMax { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int PersonsMin { get; set; }

        [ConcurrencyCheck]
        public int? ActivityId { get; set; }

        public Activity Activity { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int TrainingPartId { get; set; }

        public TrainingPart TrainingPart { get; set; }
    }
}