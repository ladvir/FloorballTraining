using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TrainingPartConverter
{
    public static TrainingPartDto? ToDto(this TrainingPart? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));



        return new TrainingPartDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Duration = entity.Duration,
            Order = entity.Order,
            TrainingGroups = entity.TrainingGroups!.Select(tg => tg.ToDto()!).ToList()
        };
    }
}