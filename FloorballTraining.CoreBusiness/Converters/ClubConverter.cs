using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class ClubConverter
{
    public static ClubDto ToDto(this Club entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new ClubDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Members = entity.Members.Any() ? entity.Members.Select(cm => cm.ToDto()).ToList() : new List<MemberDto>(),
            Teams = entity.Teams.Any() ? entity.Teams.Select(t => t.ToDto()!).ToList() : new List<TeamDto>(),

        };
    }
}