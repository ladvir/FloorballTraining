using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("ActivityTags", Schema = "dbo")]
    public partial class ActivityTag
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ConcurrencyCheck]
        public int? ActivityId { get; set; }

        public Activity Activity { get; set; }

        [ConcurrencyCheck]
        public int? TagId { get; set; }

        public Tag Tag { get; set; }
    }
}