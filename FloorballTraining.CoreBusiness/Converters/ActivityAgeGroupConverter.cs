using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class ActivityAgeGroupConverter
{
    public static ActivityAgeGroupDto? ToDto(this ActivityAgeGroup? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new ActivityAgeGroupDto
        {
            Id = entity.Id,
            AgeGroup = entity.AgeGroup!.ToDto(),
            AgeGroupId = entity.AgeGroup!.Id,
            Activity = entity.Activity!.ToDto(),
            ActivityId = entity.ActivityId
        };
    }
}