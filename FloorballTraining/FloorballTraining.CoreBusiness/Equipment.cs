namespace FloorballTraining.CoreBusiness
{
    public class Equipment : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public List<ActivityEquipment> ActivityEquipments { get; set; } = new();

        public Equipment Clone()
        {
            return new Equipment
            {
                Id = Id,
                Name = Name
            };
        }

        public void Merge(Equipment equipment)
        {
            Name = equipment.Name;
        }
    }
}