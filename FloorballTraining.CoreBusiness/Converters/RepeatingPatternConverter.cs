using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class RepeatingPatternConverter
{
    public static RepeatingPatternDto? ToDto(this RepeatingPattern? entity)
    {
        if (entity == null) return null;

        return new RepeatingPatternDto
        {
            Id = entity.Id,
            RepeatingFrequency = entity.RepeatingFrequency,
            Interval = entity.Interval,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate
        };
    }
}