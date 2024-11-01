namespace FloorballTraining.CoreBusiness.Specifications;

public class AppointmentsSpecification : BaseSpecification<Appointment>
{
    public AppointmentsSpecification(AppointmentSpecificationParameters parameters) : base(
        x =>

            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.PlaceId.HasValue || x.LocationId == parameters.PlaceId) &&
            (string.IsNullOrEmpty(parameters.PlaceName) || x.Location!.Name == parameters.PlaceName) &&
            (string.IsNullOrEmpty(parameters.Name) || x.Name == parameters.Name) &&
            (string.IsNullOrEmpty(parameters.Description) || x.Description == parameters.Name) &&

            (!parameters.PlaceId.HasValue || x.LocationId == parameters.PlaceId) &&

            (!parameters.PlaceId.HasValue || x.LocationId == parameters.PlaceId) &&
            (!parameters.Start.HasValue || x.Start >= parameters.Start) &&
            (!parameters.End.HasValue || x.End <= parameters.End) &&
            (!parameters.FutureOnly.HasValue || x.Start >= DateTime.UtcNow) &&
            (!parameters.Type.HasValue || x.AppointmentType >= parameters.Type) &&
            (!parameters.TrainingId.HasValue || x.TrainingId == parameters.TrainingId)

    )
    {
        AddInclude(m => m.Location);
        AddInclude(m => m.Training);
        
        AddInclude("Training.TrainingGoal1");
        AddInclude("Training.TrainingGoal2");
        AddInclude("Training.TrainingGoal3");
        
        AddInclude(m => m.RepeatingPattern);
        // AddInclude(m => m.ParentAppointment);
        ApplyPagination(parameters.PageSize * (parameters.PageIndex - 1), parameters.PageSize);

        AddSorting(parameters.Sort);
    }


    public AppointmentsSpecification(int id) : base(x => x.Id == id)
    {

    }

    private void AddSorting(string? sort)
    {
        if (string.IsNullOrEmpty(sort)) return;

        switch (sort.ToLower())
        {
            case "startasc":
                AddOrderBy(t => t.Start);
                break;
            case "startdesc":
                AddOrderByDescending(t => t.Start);
                break;
            default:
                AddOrderBy(t => t.Start);
                break;
        }
    }
}