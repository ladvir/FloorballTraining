using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class Equipment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public int EquipmentId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;

        public List<ActivityEquipment> ActivityEquipments { get; set; } = new();

        public Equipment Clone()
        {
            return new Equipment
            {
                EquipmentId = EquipmentId,
                Name = Name
            };
        }

        public void Merge(Equipment equipment)
        {
            Name = equipment.Name;
        }
    }
}