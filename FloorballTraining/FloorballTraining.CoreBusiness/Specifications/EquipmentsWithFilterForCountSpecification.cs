namespace FloorballTraining.CoreBusiness.Specifications;

public class EquipmentsWithFilterForCountSpecification : BaseSpecification<Equipment>
{
    public EquipmentsWithFilterForCountSpecification(EquipmentSpecificationParameters parameters) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id))
    {
    }
}