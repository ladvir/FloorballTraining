using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models
{
    [Table("Activity")]
    public class Activity //: IEquatable<Activity>
    {
        [Key]
        public int ActivityId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? PersonsMin { get; set; }
        public int? PersonsMax { get; set; }
    }
}