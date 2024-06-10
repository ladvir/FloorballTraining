namespace FloorballTraining.CoreBusiness.Specifications;

public class MembersWithFilterForCountSpecification(MemberSpecificationParameters parameters)
    : BaseSpecification<Member>(x =>
        (!parameters.Id.HasValue || x.Id == parameters.Id) &&
        (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
        (string.IsNullOrEmpty(parameters.Email) || x.Email.ToLower().Contains(parameters.Email.ToLower())) &&
        (!parameters.ClubRole.HasValue || x.ClubRole >= parameters.ClubRole) &&
        (!parameters.ClubId.HasValue || x.ClubId == parameters.ClubId) &&
        (!parameters.TeamId.HasValue || x.TeamMembers.Exists(tm => tm.TeamId == parameters.TeamId)));