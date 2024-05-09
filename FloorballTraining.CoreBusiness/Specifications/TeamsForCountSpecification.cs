namespace FloorballTraining.CoreBusiness.Specifications;

public class TeamsForCountSpecification : BaseSpecification<Team>
{
    public TeamsForCountSpecification(TeamSpecificationParameters parameters, object? env = null) : base(
        x =>
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.ClubId.HasValue || x.ClubId == parameters.ClubId) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (parameters.AgeGroup != null || x.AgeGroup == parameters.AgeGroup)
    )
    {

    }


}