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

        public Tag Clone()
        {
            return new Tag
            {
                TagId = TagId,
                Name = Name,
                Color = Color,
                ParentTagId = ParentTagId,
                ParentTag = ParentTag
            };
        }

        public void Merge(Tag tag)
        {
            Name = tag.Name;
            Color = tag.Color;
            ParentTag = tag.ParentTag;
            ParentTagId = tag.ParentTagId;
        }

    }
}