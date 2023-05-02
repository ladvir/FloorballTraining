using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Media
    {
        [Key]
        public int MediaId { get; set; }
        [Required]
        public string Path { get; set; } = string.Empty;

        public MediaType MediaType { get; set; }

        public Media Clone()
        {
            return new Media
            {
                MediaId = MediaId,
                Path = Path,
                MediaType = MediaType
            };
        }

        public void Merge(Media media)
        {
            Path = media.Path;
            MediaType = media.MediaType;
        }
    }


    public enum MediaType
    {
        Image,
        Video,
        URL

    }
}