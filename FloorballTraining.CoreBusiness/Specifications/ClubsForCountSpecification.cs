namespace FloorballTraining.CoreBusiness.Specifications;

public class ClubsForCountSpecification : BaseSpecification<Club>
{
    public ClubsForCountSpecification(ClubSpecificationParameters parameters) : base(
        x =>
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower()))
    )
    {

    }


}