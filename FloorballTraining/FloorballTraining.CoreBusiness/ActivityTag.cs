namespace FloorballTraining.CoreBusiness
{
    public class ActivityTag : BaseEntity
    {
        public int? ActivityId { get; set; }
        public Activity? Activity { get; set; }

        public int? TagId { get; set; }
        public Tag? Tag { get; set; }
    }
}
