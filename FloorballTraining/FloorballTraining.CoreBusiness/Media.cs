using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Media
    {
        [Key]
        public int MediaId { get; set; }
        [Required]
        public string Url { get; set; } = string.Empty;

        public Media Clone()
        {
            return new Media
            {
                MediaId = MediaId,
                Url = Url
            };
        }

        public void Merge(Media media)
        {
            Url = media.Url;
        }
    }
}