namespace FloorballTraining.CoreBusiness
{
    public class TrainingTag : BaseEntity
    {
        public int? TrainingId { get; set; }
        public Training? Training { get; set; }

        public int? TagId { get; set; }
        public Tag? Tag { get; set; }
    }
}
