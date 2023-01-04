namespace TrainingDataAccess.Models
{
    public class Tag
    {
        public int TagId { get; set; }

        public string Name { get; set; }

        public ICollection<Activity> Activities { get; set; }

        //public ICollection<ActivityTag> ActivityTags { get; set; }


        public Tag()
        {
            TagId = 0;
            Name = string.Empty;
            Activities = new List<Activity>();
            // ActivityTags = new List<ActivityTag>();
        }

        public Tag(Tag tag)
        {
            TagId = tag.TagId;
            Name = tag.Name;
            Activities = new List<Activity>(tag.Activities);
            //   ActivityTags = tag.ActivityTags;
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
            int nameHashCode = obj.Name.GetHashCode();
            return idHashCode ^ nameHashCode;
        }
    }
}
