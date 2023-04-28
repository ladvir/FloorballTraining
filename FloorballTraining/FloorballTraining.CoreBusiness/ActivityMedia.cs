namespace FloorballTraining.CoreBusiness
{
    public class ActivityMedia
    {
        public int ActivityId { get; set; }
        public Activity? Activity { get; set; }

        public int MediaId { get; set; }
        public Media? Media { get; set; }
    }
}
