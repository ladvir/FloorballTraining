namespace FloorballTraining.CoreBusiness.Specifications;

public class SeasonsSpecificationInclusive(SeasonSpecificationParameters parameters) : BaseSpecification<Season>(x =>
    (!parameters.Id.HasValue || x.Id == parameters.Id) ||
    (string.IsNullOrEmpty(parameters.Name) ||
     x.Name.Contains(parameters.Name, StringComparison.CurrentCultureIgnoreCase)) ||
    ((parameters.StartDate == null) || x.StartDate <= parameters.StartDate) ||
    ((parameters.EndDate == null) || x.EndDate <= parameters.EndDate));