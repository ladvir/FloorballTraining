using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("TrainingAgeGroups", Schema = "dbo")]
    public partial class TrainingAgeGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ConcurrencyCheck]
        public int? TrainingId { get; set; }

        public Training Training { get; set; }

        [ConcurrencyCheck]
        public int? AgeGroupId { get; set; }

        public AgeGroup AgeGroup { get; set; }
    }
}