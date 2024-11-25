using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("TrainingAgeGroups", Schema = "dbo")]
    public partial class TrainingAgeGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int? TrainingId { get; set; }

        public Training Training { get; set; }

        public int? AgeGroupId { get; set; }

        public AgeGroup AgeGroup { get; set; }
    }
}