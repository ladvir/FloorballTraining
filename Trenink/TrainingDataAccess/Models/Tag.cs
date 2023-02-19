using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models
{
    [Table("Tags")]
    public class Tag
    {
        //todo přesunout do configu
        public const string CustomRootTagName = @"Vlastní";
        public const string DefaultColor = "#666666;";


        [Key]
        [Required]

        public int? TagId { get; set; }

        public string? Name { get; set; }

        public int? ParentTagId { get; set; }

        public string? Color { get; set; } = DefaultColor;


        public Tag? ParentTag { get; set; }

        [NotMapped]
        public List<Tag>? Children { get; set; }

        [NotMapped]
        public Tag Root
        {
            get
            {
                var node = this;

                while (node.ParentTag != null)
                {
                    node = node.ParentTag;
                }
                return node;
            }
        }

        [NotMapped]
        public bool IsRoot => ParentTag == null;

        [NotMapped]
        public bool IsLeaf => Children?.Count == 0;
        [NotMapped]
        public int Level
        {
            get
            {
                if (IsRoot) return 0;
                if (ParentTag != null) return ParentTag.Level + 1;
                return 0;
            }
        }

        [NotMapped]
        public bool IsExpanded { get; set; }

        [NotMapped]
        public bool IsCustomRoot => (IsRoot && Name == CustomRootTagName);

        public List<Activity>? Activities { get; set; }
        public List<ActivityTag> ActivityTags { get; set; }


        public Tag()
        {
        }



        public Tag(string name)
        {
            Name = name;
        }

        public Tag(Tag tag)
        {
            TagId = tag.TagId;
            Name = tag.Name;
            ParentTagId = tag.ParentTagId;
            Color = tag.Color;
            ParentTag = tag.ParentTag;
            Children = tag.Children;
        }


        public override string ToString()
        {
            if (Name != null) return Name;

            return string.Empty;
        }
    }

    public class TagComparer : IEqualityComparer<Tag>
    {
        public bool Equals(Tag? x, Tag? y)
        {
            //First check if both object reference are equal then return true
            if (ReferenceEquals(x, y))
            {
                return true;
            }
            //If either one of the object reference is null, return false
            if (ReferenceEquals(x, null) || ReferenceEquals(y, null))
            {
                return false;
            }
            //Comparing all the properties one by one
            return x.TagId == y.TagId && x.Name == y.Name;
        }
        public int GetHashCode(Tag? obj)
        {
            //If obj is null then return 0
            if (obj == null)
            {
                return 0;
            }
            //Get the ID hash code value
            int idHashCode = obj.TagId.GetHashCode();
            //Get the Name HashCode Value
            int nameHashCode = obj.Name!.GetHashCode();
            return idHashCode ^ nameHashCode;
        }
    }
}
