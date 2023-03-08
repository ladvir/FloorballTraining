using TrainingDataAccess.Dtos;

namespace TrainingCreator.Data
{
    public static class TagTreeBuilder
    {

        public static ICollection<TagDto>? Build(ICollection<TagDto>? tags)
        {
            // Start recursive function with the top of the tree
            LoadChildren(tags, null);

            if (tags == null) return null;

            tags = tags.Where(x => x.ParentTagId == null).ToList();

            return tags;
        }

        private static List<TagDto>? LoadChildren(ICollection<TagDto>? allTags, TagDto? parentTag)
        {
            var tags = allTags?.Where(x => x.ParentTagId == parentTag?.TagId).ToList();

            if (tags == null) return null;


            foreach (var tag in tags)
                tag.Children = LoadChildren(allTags, tag);

            return tags;

        }
    }
}
