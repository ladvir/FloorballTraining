using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TrainingGroupConverter
{
    public static TrainingGroupDto? ToDto(this TrainingGroup? entity)
    {
        if (entity == null) return null;

        return new TrainingGroupDto
        {
            Id = entity.Id,
            PersonsMax = entity.PersonsMax,
            PersonsMin = entity.PersonsMin,
            Activity = entity.Activity.ToDto()
        };
    }
}