namespace FloorballTraining.CoreBusiness.Specifications;

public class PlaceSpecificationParameters
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

    public int? Length { get; set; }

    public int? Width { get; set; }

    public string? Environment { get; set; }

    public string? Sort { get; set; }
}