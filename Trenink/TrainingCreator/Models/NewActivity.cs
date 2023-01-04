using System.ComponentModel.DataAnnotations;
using TrainingDataAccess.Models;

namespace TrainingCreator.Models
{
    public class NewActivity
    {
        [Required]
        [StringLength(50, ErrorMessage = @"Příliš dlouhý název")]
        [MinLength(3, ErrorMessage = @"Příliš krátký název")]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? PersonsMin { get; set; }
        public int? PersonsMax { get; set; }

        public List<Tag> Tags { get; set; } = new List<Tag>();
    }
}
