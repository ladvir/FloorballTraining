namespace FloorballTraining.CoreBusiness.Specifications;

public class AppointmentsWithFilterForCountSpecification : BaseSpecification<Appointment>
{
    public AppointmentsWithFilterForCountSpecification(AppointmentSpecificationParameters parameters, object? env = null) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.Start.HasValue || x.Start >= parameters.Start) &&
            (!parameters.Duration.HasValue || x.Duration <= parameters.Duration) &&
            (!parameters.TrainingId.HasValue || x.TrainingId == parameters.TrainingId)
    )
    {
    }
}