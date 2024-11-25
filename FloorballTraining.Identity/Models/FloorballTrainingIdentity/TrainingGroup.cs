using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("TrainingGroups", Schema = "dbo")]
    public partial class TrainingGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int PersonsMax { get; set; }

        [Required]
        public int PersonsMin { get; set; }

        public int? ActivityId { get; set; }

        public Activity Activity { get; set; }

        [Required]
        public int TrainingPartId { get; set; }

        public TrainingPart TrainingPart { get; set; }
    }
}