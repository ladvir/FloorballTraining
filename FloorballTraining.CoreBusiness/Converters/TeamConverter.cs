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
            TeamMembers = entity.TeamMembers.Count != 0 ? entity.TeamMembers.Select(tm => tm.ToDto()).ToList() : [],
            Appointments =  entity.Appointments.Count != 0 ? entity.Appointments.Select(t => t.ToDto()).ToList() : []
        };
    }
}
