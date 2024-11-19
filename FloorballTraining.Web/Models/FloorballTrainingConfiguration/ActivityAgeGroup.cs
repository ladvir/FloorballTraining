using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("ActivityAgeGroups", Schema = "dbo")]
    public partial class ActivityAgeGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ConcurrencyCheck]
        public int? ActivityId { get; set; }

        public Activity Activity { get; set; }

        [ConcurrencyCheck]
        public int? AgeGroupId { get; set; }

        public AgeGroup AgeGroup { get; set; }
    }
}