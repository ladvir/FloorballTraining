namespace FloorballTraining.CoreBusiness.Specifications;

public class SeasonSpecificationParameters
{
    private const int MaxPageSize = 50;

    public int PageIndex { get; set; } = 1;

    private int _pageSize = 50;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = (value > MaxPageSize ? MaxPageSize : value);
    }

    public int? Id { get; set; }
    public string? Name { get; set; }
    
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public string? Sort { get; set; }
}