namespace FloorballTraining.CoreBusiness.Specifications;

public class SeasonsSpecification(SeasonSpecificationParameters parameters) : BaseSpecification<Season>(x =>
    (!parameters.Id.HasValue || x.Id == parameters.Id) &&
    (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name)) &&
    ((!parameters.StartDate.HasValue) || x.StartDate.Date >= parameters.StartDate.Value.Date) &&
    ((!parameters.EndDate.HasValue) || x.EndDate.Date <= parameters.EndDate.Value.Date));