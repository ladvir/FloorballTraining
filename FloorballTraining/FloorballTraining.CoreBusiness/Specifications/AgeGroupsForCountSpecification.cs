namespace FloorballTraining.CoreBusiness.Specifications;

public class AgeGroupsForCountSpecification : BaseSpecification<AgeGroup>
{
    public AgeGroupsForCountSpecification(AgeGroupSpecificationParameters parameters) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (string.IsNullOrEmpty(parameters.Description) ||
             x.Description.ToLower().Contains(parameters.Description.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.IsAnyAge.HasValue || x.IsAnyAge() == parameters.IsAnyAge)
    )
    {
    }
}