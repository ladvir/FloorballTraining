using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models
{
    [Table("Tag")]
    public class Tag
    {
        [Key]
        public int TagId { get; set; }

        public string Name { get; set; } = string.Empty;
    }
}
