using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Media
    {
        [Key]
        public int MediaId { get; set; }
        [Required]
        public string Path { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public MediaType MediaType { get; set; }

        public Media Clone()
        {
            return new Media
            {
                MediaId = MediaId,
                Path = Path,
                Name = Name,
                MediaType = MediaType
            };
        }

        public void Merge(Media media)
        {
            Path = media.Path;
            Name = media.Name;
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