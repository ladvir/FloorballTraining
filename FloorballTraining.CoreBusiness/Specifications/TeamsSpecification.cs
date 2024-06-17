namespace FloorballTraining.CoreBusiness.Specifications;

public class TeamsSpecification : BaseSpecification<Team>
{
    public TeamsSpecification(TeamSpecificationParameters parameters, object? env = null) : base(
        x =>
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.ClubId.HasValue || x.ClubId == parameters.ClubId) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (parameters.AgeGroup == null || x.AgeGroup == parameters.AgeGroup)
    )
    {
        AddInclude(x => x.Club);
        AddInclude(x => x.AgeGroup);
        AddInclude(x => x.TeamMembers);

        AddOrderBy(t => t.Name);

        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);

        AddSorting(parameters.Sort);
    }

    public TeamsSpecification(int id) : base(x => x.Id == id)
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
            case "idasc":
                AddOrderBy(t => t.Id);
                break;
            case "iddesc":
                AddOrderByDescending(t => t.Id);
                break;

            case "agegroupasc":
                AddOrderBy(t => t.AgeGroup!);
                break;
            case "agegroupdesc":
                AddOrderByDescending(t => t.AgeGroup!);
                break;
            default:
                AddOrderBy(t => t.Name);
                break;
        }
    }
}