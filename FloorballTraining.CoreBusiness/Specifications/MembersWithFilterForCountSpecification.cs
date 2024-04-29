namespace FloorballTraining.CoreBusiness.Specifications;

public class MembersWithFilterForCountSpecification : BaseSpecification<Member>
{
    public MembersWithFilterForCountSpecification(MemberSpecificationParameters parameters) : base(
        x =>
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (string.IsNullOrEmpty(parameters.Email) || x.Email.ToLower().Contains(parameters.Email.ToLower())) &&
            (!parameters.ClubRole.HasValue || x.ClubRole >= parameters.ClubRole)
    )
    {
    }

}