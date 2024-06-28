namespace FloorballTraining.CoreBusiness.Specifications;

public class ClubsSpecification : BaseSpecification<Club>
{
    public ClubsSpecification(ClubSpecificationParameters parameters, object? env = null) : base(
        x =>
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower()))
    )
    {
        AddInclude(t => t.Teams);
        AddOrderBy(t => t.Name);

        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);

        AddSorting(parameters.Sort);

        AddInclude(t => t.Members);
        AddInclude("Teams.AgeGroup");
    }

    public ClubsSpecification(int id) : base(x => x.Id == id)
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
            default:
                AddOrderBy(t => t.Name);
                break;
        }
    }
}