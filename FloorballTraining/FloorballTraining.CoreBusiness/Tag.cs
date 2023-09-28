using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness
{
    public class Tag
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int TagId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Color { get; set; } = "#858791";


        public int? ParentTagId { get; set; }

        public Tag? ParentTag { get; set; }

        public bool IsTrainingGoal { get; set; }

        public List<ActivityTag> ActivityTags { get; set; } = new();

        public Tag Clone()
        {
            return new Tag
            {
                TagId = TagId,
                Name = Name,
                Color = Color,
                ParentTagId = ParentTagId,
                ParentTag = ParentTag,
                IsTrainingGoal = IsTrainingGoal
            };
        }

        public void Merge(Tag tag)
        {
            Name = tag.Name;
            Color = tag.Color;
            ParentTag = tag.ParentTag;
            ParentTagId = tag.ParentTagId;
            IsTrainingGoal = tag.IsTrainingGoal;
        }

    }
}