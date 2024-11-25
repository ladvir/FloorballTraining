using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("ActivityAgeGroups", Schema = "dbo")]
    public partial class ActivityAgeGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int? ActivityId { get; set; }

        public Activity Activity { get; set; }

        public int? AgeGroupId { get; set; }

        public AgeGroup AgeGroup { get; set; }
    }
}