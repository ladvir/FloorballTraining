using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("ActivityMedium", Schema = "dbo")]
    public partial class ActivityMedium
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ActivityId { get; set; }

        public Activity Activity { get; set; }

        [Required]
        public string Path { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public int MediaType { get; set; }

        [Required]
        public string Preview { get; set; }

        [Required]
        public string Data { get; set; }
    }
}