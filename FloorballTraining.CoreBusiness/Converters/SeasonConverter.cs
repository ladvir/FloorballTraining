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
            ClubId = entity.ClubId,
            ClubName = entity.Club?.Name,
            Teams = entity.Teams.Select(t => t.ToDto()).ToList()
        };
    }
}