using TrainingDataAccess.Models;

namespace TrainingCreator.Data
{
    public class TagList : List<Tag>
    {
        public Tag Parent;

        public TagList(Tag parent)
        {
            Parent = parent;
        }

        public new Tag Add(Tag tag)
        {
            base.Add(tag);

            tag.ParentTag = Parent;

            return tag;

        }

        public Tag Add(string name)
        {
            return Add(new Tag(name));
        }

        public override string ToString()
        {
            return "Count =" + Count;
        }
    }
}