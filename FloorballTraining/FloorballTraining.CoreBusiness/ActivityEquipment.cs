namespace FloorballTraining.CoreBusiness
{
    public class ActivityEquipment
    {
        public int ActivityId { get; set; }
        public Activity? Activity { get; set; }

        public int EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }
    }
}
