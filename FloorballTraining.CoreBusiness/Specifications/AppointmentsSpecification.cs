namespace FloorballTraining.CoreBusiness.Specifications;

public class AppointmentsSpecification : BaseSpecification<Appointment>
{
    public AppointmentsSpecification(AppointmentSpecificationParameters parameters, object? env = null) : base(
        x =>

            (string.IsNullOrEmpty(parameters.Name) || x.Name.ToLower().Contains(parameters.Name.ToLower())) &&
            (!parameters.Id.HasValue || x.Id == parameters.Id) &&
            (!parameters.Start.HasValue || x.Start >= parameters.Start) &&
            (!parameters.Duration.HasValue || x.Duration <= parameters.Duration) &&
            (!parameters.TrainingId.HasValue || x.TrainingId == parameters.TrainingId)

    )
    {
        AddOrderBy(t => t.Name);

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
            case "nameasc":
                AddOrderBy(t => t.Name);
                break;
            case "namedesc":
                AddOrderByDescending(t => t.Name);
                break;
            default:
                AddOrderBy(t => t.Name);
                break;
        }
    }
}