namespace FloorballTraining.CoreBusiness.Specifications;

public class MembersSpecification : BaseSpecification<Member>
{
    public MembersSpecification(MemberSpecificationParameters parameters, object? env = null) : base(
        x =>
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (string.IsNullOrEmpty(parameters.Email) || x.Email.ToLower().Contains(parameters.Email.ToLower())) &&
            (!parameters.ClubRole.HasValue || x.ClubRole >= parameters.ClubRole) &&
            (!parameters.ClubId.HasValue || x.ClubId == parameters.ClubId) &&
            (!parameters.TeamId.HasValue || x.TeamMembers.Exists(tm => tm.TeamId == parameters.TeamId))
    )
    {
        AddOrderBy(t => t.Name);

        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);

        AddSorting(parameters.Sort);

        AddInclude(m => m.Club);
    }

    public MembersSpecification(int id) : base(x => x.Id == id)
    {
    }

    private void AddSorting(string? sort)
    {
        if (string.IsNullOrEmpty(sort)) return;

        switch (sort.ToLower())
        {
            case "nameasc":
                AddOrderBy(t => t.Name);
                break;
            case "namedesc":
                AddOrderByDescending(t => t.Name);
                break;
            case "emailasc":
                AddOrderBy(t => t.Email);
                break;
            case "emaildesc":
                AddOrderByDescending(t => t.Email);
                break;
            case "idasc":
                AddOrderBy(t => t.Id);
                break;
            case "iddesc":
                AddOrderByDescending(t => t.Id);
                break;

            case "roleasc":
                AddOrderBy(t => t.ClubRole);
                break;
            case "roledesc":
                AddOrderByDescending(t => t.ClubRole);
                break;
            default:
                AddOrderBy(t => t.Name);
                break;
        }
    }
}