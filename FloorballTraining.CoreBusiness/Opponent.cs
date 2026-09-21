namespace FloorballTraining.CoreBusiness;

/// <summary>A per-club catalog of opponent team names, selectable when scheduling a Match appointment.</summary>
public class Opponent : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public int ClubId { get; set; }
    public Club? Club { get; set; }
}
