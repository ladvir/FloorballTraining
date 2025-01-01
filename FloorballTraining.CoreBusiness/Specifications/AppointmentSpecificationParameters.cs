using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Specifications;

public class AppointmentSpecificationParameters
{
    private const int MaxPageSize = 500;

    public int PageIndex { get; set; } = 1;

    private int _pageSize = 50;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = (value > MaxPageSize ? MaxPageSize : value);
    }

    public int? Id { get; set; }
    public string? Name { get; set; }

    public DateTime? Start { get; set; }

    public DateTime? End { get; set; }

    public int? TrainingId { get; set; }

    public string? Sort { get; set; } = "ascstart";

    public int? PlaceId { get; set; }

    public bool? FutureOnly { get; set; }

    public AppointmentType? Type { get; set; }

    public string? PlaceName { get; set; }
    public string? Description { get; set; }


}