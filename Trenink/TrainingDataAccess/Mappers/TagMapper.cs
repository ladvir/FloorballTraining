using TrainingDataAccess.Dtos;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Mappers;

public static class TagMapper
{
    public static IQueryable<TagDto> MapToTagDto(this IQueryable<Tag> tags)
    {
        return tags.Select(a => MapToTagDto(a));
    }

    public static TagDto MapToTagDto(this Tag tag)
    {
        return new TagDto
        {
            TagId = tag.TagId,
            Name = tag.Name,
            Color = tag.Color,
            ParentTag = GetTag(tag.ParentTag)
        };
    }

    private static TagDto? GetTag(Tag? tag)
    {
        if (tag == null)
        {
            return null;
        }

        var t = new TagDto
        {
            TagId = tag.TagId,
            ParentTagId = tag.ParentTagId,
            Color = tag.Color,
            Name = tag.Name,
            ParentTag = tag.ParentTag != null ? GetTag(tag.ParentTag) : null
        };
        return t;
    }


}