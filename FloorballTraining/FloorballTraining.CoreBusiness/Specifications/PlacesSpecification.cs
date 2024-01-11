using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.CoreBusiness.Specifications;

public class PlacesSpecification : BaseSpecification<Place>
{
    public PlacesSpecification(PlaceSpecificationParameters parameters, object? env = null) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.Width.HasValue || x.Width >= parameters.Width) &&
            (!parameters.Length.HasValue || x.Length >= parameters.Length) &&
            (string.IsNullOrEmpty(parameters.Environment) || (Enum.TryParse(typeof(Environment), parameters.Environment, true, out env) && x.Environment == (Environment)env))

    )
    {
        AddOrderBy(t => t.Name);

        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);

        AddSorting(parameters.Sort);

    }



    public PlacesSpecification(int id) : base(x => x.Id == id)
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
            case "widthasc":
                AddOrderBy(t => t.Width);
                break;
            case "widthdesc":
                AddOrderByDescending(t => t.Width);
                break;
            case "lengthasc":
                AddOrderBy(t => t.Length);
                break;
            case "lengthdesc":
                AddOrderByDescending(t => t.Length);
                break;

            case "environmentasc":
                AddOrderBy(t => t.Environment.ToString());
                break;
            case "environmentdesc":
                AddOrderByDescending(t => t.ToString());
                break;
            default:
                AddOrderBy(t => t.Name);
                break;
        }
    }
}