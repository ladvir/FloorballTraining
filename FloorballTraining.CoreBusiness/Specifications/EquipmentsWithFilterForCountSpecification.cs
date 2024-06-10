namespace FloorballTraining.CoreBusiness.Specifications;

public class EquipmentsWithFilterForCountSpecification(EquipmentSpecificationParameters parameters)
    : BaseSpecification<Equipment>(x =>
        (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
        (!parameters.Id.HasValue || x.Id == parameters.Id));