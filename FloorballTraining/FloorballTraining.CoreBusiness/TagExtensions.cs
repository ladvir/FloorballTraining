namespace FloorballTraining.CoreBusiness
{
    public static class TagExtensions
    {
        public static Tag Clone(this Tag existingTag)
        {
            var clone = new Tag
            {
                TagId = existingTag.TagId,
                Name = existingTag.Name,
                Color = existingTag.Color,
                ParentTagId = existingTag.ParentTagId,
                ParentTag = existingTag.ParentTag
            };

            return clone;
        }

        public static void Merge(this Tag existingTag, Tag tag)
        {
            existingTag.Name = tag.Name;
            existingTag.Color = tag.Color;
            existingTag.ParentTag = tag.ParentTag;
            existingTag.ParentTagId = tag.ParentTagId;
        }
    }
}
