using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TeamMemberConverter
{
    public static TeamMemberDto ToDto(this TeamMember entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new TeamMemberDto
        {
            Id = entity.Id,
            TeamId = entity.TeamId,
            Team = entity.Team!.ToDto()!,
            MemberId = entity.MemberId,
            Member = entity.Member!.ToDto(),
            IsCoach = entity.IsCoach,
            IsPlayer = entity.IsPlayer
        };
    }
}
