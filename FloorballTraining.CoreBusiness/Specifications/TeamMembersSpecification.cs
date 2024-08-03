namespace FloorballTraining.CoreBusiness.Specifications;

public class TeamMembersSpecification : BaseSpecification<TeamMember>
{
    public TeamMembersSpecification(TeamMemberSpecificationParameters parameters) : base(
        x =>
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Member!.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (!parameters.MemberId.HasValue || x.Member!.Id == parameters.MemberId) &&
            (string.IsNullOrEmpty(parameters.Email) || x.Member!.Email.ToLower().Contains(parameters.Email.ToLower())) &&
            (!parameters.IsCoach.HasValue || x.IsCoach == parameters.IsCoach) &&
            (!parameters.IsPlayer.HasValue || x.IsPlayer == parameters.IsPlayer) &&
            (!parameters.ClubId.HasValue || (x.Team != null && x.Team.Club != null && x.Team.Club.Id == parameters.ClubId)) &&
            (!parameters.TeamId.HasValue || (x.Team != null && x.Team.Id == parameters.TeamId))
    )
    {
        AddOrderBy(t => t.Member!.Name);

        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);

        AddSorting(parameters.Sort);

        AddInclude(m => m.Member);
        AddInclude(m => m.Team);
        AddInclude("Team.Club");

    }

    public TeamMembersSpecification(int id) : base(x => x.Id == id)
    {
    }

    private void AddSorting(string? sort)
    {
        if (string.IsNullOrEmpty(sort)) return;

        switch (sort.ToLower())
        {
            case "nameasc":
                AddOrderBy(t => t.Member!.Name);
                break;
            case "namedesc":
                AddOrderByDescending(t => t.Member!.Name);
                break;
            case "emailasc":
                AddOrderBy(t => t.Member!.Email);
                break;
            case "emaildesc":
                AddOrderByDescending(t => t.Member!.Email);
                break;
            case "idasc":
                AddOrderBy(t => t.Id);
                break;
            case "iddesc":
                AddOrderByDescending(t => t.Id);
                break;
            default:
                AddOrderBy(t => t.Member!.Name);
                break;
        }
    }
}