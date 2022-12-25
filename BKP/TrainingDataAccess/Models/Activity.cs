namespace TrainingDataAccess.Models
{
    public class Activity //: IEquatable<Activity>
    {
        //[Key] public int ActivityId { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public int? PersonsMin { get; set; }
        public int? PersonsMax { get; set; }
    }
}
