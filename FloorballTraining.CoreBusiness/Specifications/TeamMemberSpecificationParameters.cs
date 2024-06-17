namespace FloorballTraining.CoreBusiness.Specifications;

public class TeamMemberSpecificationParameters
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

    public int? MemberId { get; set; }
    public string? Name { get; set; }

    public string? Email { get; set; }

    public bool? IsCoach { get; set; }
    public bool? IsPlayer { get; set; }

    public int? ClubId { get; set; }

    public int? TeamId { get; set; }

    public string? Sort { get; set; }
}