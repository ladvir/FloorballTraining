public class AgeGroupSpecificationParameters
{
    private const int MaxPageSize = 50;

    public int PageIndex { get; set; } = 1;

    private int _pageSize = 20;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = (value > MaxPageSize ? MaxPageSize : value);
    }

    public int? Id { get; set; }
    public string? Name { get; set; }

    public string? Description { get; set; }

    public bool? IsAnyAge { get; set; }

    public string? Sort { get; set; }
}