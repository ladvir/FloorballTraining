namespace FloorballTraining.CoreBusiness
{
    public class TeamTraining : BaseEntity
    {
        public int TeamId { get; set; }
        public Team? Team { get; set; }

        public int TrainingId { get; set; }
        public Training? Training { get; set; }
    }




}