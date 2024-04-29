namespace FloorballTraining.CoreBusiness.Specifications;

public class TeamsForCountSpecification : BaseSpecification<Team>
{
    public TeamsForCountSpecification(TeamSpecificationParameters parameters, object? env = null) : base(
        x =>
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (parameters.AgeGroup != null || x.AgeGroup == parameters.AgeGroup)
    )
    {

    }


}