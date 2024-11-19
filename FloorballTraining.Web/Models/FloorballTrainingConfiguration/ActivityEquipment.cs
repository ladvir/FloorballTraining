using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("ActivityEquipments", Schema = "dbo")]
    public partial class ActivityEquipment
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
        public int EquipmentId { get; set; }

        public Equipment Equipment { get; set; }
    }
}