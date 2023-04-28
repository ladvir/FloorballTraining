using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Equipment
    {
        [Key]
        public int EquipmentId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;

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