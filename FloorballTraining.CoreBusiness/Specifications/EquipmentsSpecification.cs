namespace FloorballTraining.CoreBusiness.Specifications;

public class EquipmentsSpecification : BaseSpecification<Equipment>
{
    public EquipmentsSpecification(EquipmentSpecificationParameters parameters) : base(
            x =>
                (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
                (!parameters.Id.HasValue || x.Id == parameters.Id))
    {
        AddOrderBy(t => t.Name);
        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);
        AddSorting(parameters.Sort);
    }

    public EquipmentsSpecification(int id) : base(x => x.Id == id)
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
            default:
                AddOrderBy(t => t.Name);
                break;
        }
    }
}