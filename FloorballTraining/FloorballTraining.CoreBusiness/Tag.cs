using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.CoreBusiness
{
    public class Tag
    {
        [Key]
        public int TagId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;

        public string Color { get; set; } = string.Empty;


        public int? ParentTagId { get; set; } = null;

        public Tag? ParentTag { get; set; }

    }
}