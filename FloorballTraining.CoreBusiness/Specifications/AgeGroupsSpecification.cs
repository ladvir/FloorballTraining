namespace FloorballTraining.CoreBusiness.Specifications;

public class AgeGroupsSpecification : BaseSpecification<AgeGroup>
{
    public AgeGroupsSpecification(AgeGroupSpecificationParameters parameters) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (string.IsNullOrEmpty(parameters.Description) || x.Description.ToLower().Contains(parameters.Description.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.IsAnyAge.HasValue || x.IsAnyAge() == parameters.IsAnyAge)
    )
    {
        AddOrderBy(t => t.Name);
        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);
        AddSorting(parameters.Sort);
    }

    public AgeGroupsSpecification(int id) : base(x => x.Id == id)
    {
    }

    private void AddSorting(string? sort)
    {
        if (string.IsNullOrEmpty(sort)) return;

        switch (sort)
        {
            case "nameAsc":
                AddOrderBy(t => t.Name);
                break;
            case "nameDesc":
                AddOrderByDescending(t => t.Name);
                break;
            case "descriptionAsc":
                AddOrderBy(t => t.Description);
                break;
            case "descriptionDesc":
                AddOrderByDescending(t => t.Description);
                break;
            default:
                AddOrderBy(t => t.Id);
                break;
        }
    }
}