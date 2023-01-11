using TrainingDataAccess.Models;

namespace TrainingCreator.Data
{
    public static class TagTreeBuilder
    {

        public static ICollection<Tag>? Build(ICollection<Tag>? tags)
        {
            // Start recursive function with the top of the tree
            LoadChildren(tags, null);

            if (tags == null) return null;

            tags = tags.Where(x => x.ParentTagId == null).ToList();

            return tags;
        }

        private static List<Tag>? LoadChildren(ICollection<Tag>? allTags, Tag? parentTag)
        {
            var tags = allTags?.Where(x => x.ParentTagId == parentTag?.TagId).ToList();

            if (tags == null) return null;


            foreach (var tag in tags)
                tag.Children = LoadChildren(allTags, tag);

            return tags;

        }
    }
}
