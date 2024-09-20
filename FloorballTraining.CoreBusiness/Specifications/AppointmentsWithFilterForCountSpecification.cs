namespace FloorballTraining.CoreBusiness.Specifications;

public class AppointmentsWithFilterForCountSpecification : BaseSpecification<Appointment>
{
    public AppointmentsWithFilterForCountSpecification(AppointmentSpecificationParameters parameters, object? env = null) : base(
        x =>

            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.PlaceId.HasValue || x.LocationId == parameters.PlaceId) &&
            (string.IsNullOrEmpty(parameters.PlaceName) || x.Location!.Name == parameters.PlaceName) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name == parameters.Name) &&
            (string.IsNullOrEmpty(parameters.Description) || x.Description == parameters.Name) &&
            (!parameters.FutureOnly.HasValue || x.Start >= DateTime.UtcNow) &&
            (!parameters.Start.HasValue || x.Start >= parameters.Start) &&
            (!parameters.End.HasValue || x.End <= parameters.End) &&
            (!parameters.TrainingId.HasValue || x.TrainingId == parameters.TrainingId)
    )
    {
    }
}