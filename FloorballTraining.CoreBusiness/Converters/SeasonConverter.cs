using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class SeasonConverter
{
    public static SeasonDto ToDto(this Season entity)
    {
        ArgumentNullException.ThrowIfNull(entity);

        return new SeasonDto()
        {
            Id = entity.Id,
            Name = entity.Name,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            Teams = entity.Teams.Select(t => t.ToDto()).ToList()
        };
    }
}