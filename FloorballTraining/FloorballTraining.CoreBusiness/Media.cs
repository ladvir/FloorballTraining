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

        public byte[]? Preview { get; set; }

        public string Data { get; set; } = string.Empty;

        public Media Clone()
        {
            return new Media
            {
                MediaId = MediaId,
                Path = Path,
                Name = Name,
                MediaType = MediaType,
                Preview = Preview,
                Data = Data
            };
        }

        public void Merge(Media media)
        {
            Path = media.Path;
            Name = media.Name;
            MediaType = media.MediaType;
            Preview = media.Preview;
            Data = media.Data;
        }
    }


    public enum MediaType
    {
        Image,
        Video,
        URL
    }
}