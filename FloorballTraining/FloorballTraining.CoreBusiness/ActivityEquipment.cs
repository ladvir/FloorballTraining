using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class ActivityEquipment
    {
        [Key]
        [Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int ActivityId { get; set; }
        public Activity? Activity { get; set; }

        public int EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }
    }
}
