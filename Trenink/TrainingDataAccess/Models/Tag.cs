using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingDataAccess.Models
{
    public class Tag
    {
        public int TagId { get; set; }

        public string? Name { get; set; }

        public int? ParentTagId { get; set; }

        public string? Color { get; set; }


        public Tag? ParentTag { get; set; }

        [NotMapped]
        public List<Tag>? Children { get; set; }

        [NotMapped]
        public bool IsExpanded { get; set; }
        public ICollection<Activity>? Activities { get; set; }

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
