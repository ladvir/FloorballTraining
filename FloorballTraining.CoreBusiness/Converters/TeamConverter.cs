using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TeamConverter
{
    public static TeamDto? ToDto(this Team? entity)
    {
        if (entity == null) return null;

        return new TeamDto
        {
            Id = entity.Id,
            Name = entity.Name,
            AgeGroup = entity.AgeGroup!.ToDto(),
            AgeGroupId = entity.AgeGroup?.Id ?? entity.AgeGroupId,
            Club = entity.Club!.ToDto(),
            ClubId = entity.ClubId,
            TeamMembers = entity.TeamMembers.Any() ? entity.TeamMembers.Select(tm => tm.ToDto()).ToList() : [],
            Appointments = entity.Appointments != null && entity.Appointments.Any() ? entity.Appointments.Select(t => t.ToDto()).ToList() : []
        };
    }
}
