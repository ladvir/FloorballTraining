namespace FloorballTraining.CoreBusiness.Specifications;

public class TeamMembersWithFilterForCountSpecification(TeamMemberSpecificationParameters parameters)
    : BaseSpecification<TeamMember>(x =>
        (!parameters.Id.HasValue || x.Id == parameters.Id) &&
        (string.IsNullOrEmpty(parameters.Name) || x.Member.Name.ToLower().Contains(parameters.Name.ToLower())) &&
        (!parameters.MemberId.HasValue || x.Member.Id == parameters.MemberId) &&
        (string.IsNullOrEmpty(parameters.Email) || x.Member.Email.ToLower().Contains(parameters.Email.ToLower())) &&
        (!parameters.IsCoach.HasValue || x.IsCoach == parameters.IsCoach) &&
        (!parameters.IsPlayer.HasValue || x.IsPlayer == parameters.IsPlayer) &&
        (!parameters.ClubId.HasValue || x.Team!.Club!.Id == parameters.ClubId) &&
        (!parameters.TeamId.HasValue || x.Team!.Id == parameters.TeamId)
);