namespace FloorballTraining.CoreBusiness.Dtos;

public class ClubDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public List<TeamDto> Teams { get; set; } = [];

    public List<MemberDto>? Members { get; set; } = [];


    public override bool Equals(object? o)
    {
        if (o == null) return false;
        var other = o as ClubDto;
        return other?.Id == Id;
    }

    // Note: this is important so the select can compare pizzas
    public override int GetHashCode() => Id.GetHashCode();
}
