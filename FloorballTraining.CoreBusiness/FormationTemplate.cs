namespace FloorballTraining.CoreBusiness;

public class FormationTemplate : BaseEntity
{
    public int? ClubId { get; set; }
    public Club? Club { get; set; }

    public string Name { get; set; } = null!;

    /// <summary>Number of skaters on field (3, 4, 5). Goalie counted separately.</summary>
    public int FormationSize { get; set; }

    /// <summary>Whether goalie slot is part of the template (false = e.g. 5+0 power play).</summary>
    public bool IncludesGoalie { get; set; } = true;

    public bool IsBuiltIn { get; set; }

    public List<FormationTemplateSlot> Slots { get; set; } = [];
}
