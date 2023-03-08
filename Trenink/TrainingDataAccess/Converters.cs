using TrainingDataAccess.Dtos;
using TrainingDataAccess.Models;

namespace TrainingDataAccess
{
    public static class TagConverter
    {
        public static IQueryable<TagDto>
            MapToDto(this IQueryable<Tag> tags)
        {
            return tags.Select(t => new TagDto
            {
                TagId = t.TagId,
                Name = t.Name,
                ParentTagId = t.ParentTagId,
                Color = t.Color
            }

            );
        }
    }
}
