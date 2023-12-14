namespace FloorballTraining.CoreBusiness
{
    public class ActivityMedia : BaseEntity
    {
        public int ActivityId { get; set; }
        public Activity? Activity { get; set; }

        public string Path { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public MediaType MediaType { get; set; }

        public string Preview { get; set; } = string.Empty;

        public string Data { get; set; } = string.Empty;


        public ActivityMedia Clone()
        {
            return new ActivityMedia
            {
                Id = Id,
                ActivityId = ActivityId,
                Activity = Activity,
                Path = Path,
                Name = Name,
                MediaType = MediaType,
                Preview = Preview,
                Data = Data
            };
        }

        public void Merge(ActivityMedia media)
        {
            Activity = media.Activity;
            ActivityId = media.ActivityId;
            Path = media.Path;
            Name = media.Name;
            MediaType = media.MediaType;
            Preview = media.Preview;
            Data = media.Data;
        }
    }
}