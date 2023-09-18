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

        public int MediaId { get; set; }
        public Media? Media { get; set; }
    }
}
