namespace FloorballTraining.CoreBusiness.Specifications;

public class ClubsForCountSpecification(ClubSpecificationParameters parameters) : BaseSpecification<Club>(x =>
    (!parameters.Id.HasValue || x.Id == parameters.Id) &&
    (string.IsNullOrEmpty(parameters.Name) ||
     x.Name.Contains(parameters.Name, StringComparison.CurrentCultureIgnoreCase)));