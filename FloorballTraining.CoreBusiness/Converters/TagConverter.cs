using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TagConverter
{
    public static TagDto? ToDto(this Tag? entity)
    {
        if (entity == null) return null;

        return new TagDto
        {
            Id = entity.Id,
            Name = entity.Name,
            ParentTagName = entity.ParentTag?.Name,
            IsTrainingGoal = entity.IsTrainingGoal,
            ParentTagId = entity.ParentTagId,
            Color = entity.Color
        };
    }
}