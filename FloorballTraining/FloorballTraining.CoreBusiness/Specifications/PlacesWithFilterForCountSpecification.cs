namespace FloorballTraining.CoreBusiness.Specifications;

public class PlacesWithFilterForCountSpecification : BaseSpecification<Place>
{
    public PlacesWithFilterForCountSpecification(PlaceSpecificationParameters parameters, object? env = null) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.Width.HasValue || x.Width >= parameters.Width) &&
            (!parameters.Length.HasValue || x.Length >= parameters.Length) &&
            (string.IsNullOrEmpty(parameters.Environment) || (Enum.TryParse(typeof(Environment), parameters.Environment, true, out env) && x.Environment == (Environment)env))
    )
    {
    }
}