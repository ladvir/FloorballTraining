using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models
{
    [Table("Tags")]
    public class Tag
    {



        [Key]
        [Required]
        public int TagId { get; set; }

        public string Name { get; set; } = string.Empty;

        public int? ParentTagId { get; set; }

        public string Color { get; set; } = string.Empty;


        public Tag? ParentTag { get; set; }


        public List<Activity>? Activities { get; set; } = new List<Activity>();
        public List<ActivityTag> ActivityTags { get; set; } = new List<ActivityTag>();


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

        }


        public override string ToString()
        {
            if (Name != null) return Name;

            return string.Empty;
        }

        public void Initialize(int tagId, string name, int? parentTagId, string color)
        {
            TagId = tagId;
            Name = name;
            ParentTagId = parentTagId;
            Color = color;
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
