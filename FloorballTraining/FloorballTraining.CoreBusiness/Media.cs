using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class ActivityMedia
    {
        [Key]
        [Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ActivityMediaId { get; set; }
        public int ActivityId { get; set; }
        public Activity? Activity { get; set; }


        [Required]
        public string Path { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public MediaType MediaType { get; set; }

        public string Preview { get; set; } = string.Empty;

        public string Data { get; set; } = string.Empty;


        public ActivityMedia Clone()
        {
            return new ActivityMedia
            {
                ActivityMediaId = ActivityMediaId,
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