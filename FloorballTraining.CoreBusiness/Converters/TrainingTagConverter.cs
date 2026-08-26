using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TrainingTagConverter
{
    public static TrainingTagDto? ToDto(this TrainingTag? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new TrainingTagDto
        {
            Id = entity.Id,
            Tag = entity.Tag.ToDto(),
            TagId = entity.TagId,
            TrainingId = entity.TrainingId
        };
    }
}
