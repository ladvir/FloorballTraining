using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("Equipments", Schema = "dbo")]
    public partial class Equipment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Name { get; set; }

        public ICollection<ActivityEquipment> ActivityEquipments { get; set; }
    }
}