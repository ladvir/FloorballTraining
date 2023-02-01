namespace TrainingDataAccess.Models
{
    //[Table("ActivityTags")]
    public class ActivityTag
    {
        /* [Key]
         public int Id { get; set; }*/

        public int ActivityId { get; set; }
        public Activity Activity { get; set; }

        public int TagId { get; set; }
        public Tag Tag { get; set; }
    }
}