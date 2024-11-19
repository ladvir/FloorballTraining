using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("ActivityMedium", Schema = "dbo")]
    public partial class ActivityMedium
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int ActivityId { get; set; }

        public Activity Activity { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Path { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Name { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int MediaType { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Preview { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Data { get; set; }
    }
}