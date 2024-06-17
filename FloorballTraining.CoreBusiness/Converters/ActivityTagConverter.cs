using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class ActivityTagConverter
{
    public static ActivityTagDto? ToDto(this ActivityTag? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new ActivityTagDto
        {
            Id = entity.Id,
            Tag = entity.Tag.ToDto(),
            TagId = entity.Tag?.Id,
            ActivityId = entity.ActivityId
        };
    }
}