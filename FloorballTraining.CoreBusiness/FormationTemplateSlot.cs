using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class FormationTemplateSlot : BaseEntity
{
    public int FormationTemplateId { get; set; }
    public FormationTemplate? FormationTemplate { get; set; }

    public SlotPosition Position { get; set; }

    /// <summary>0..100 (% of field width, left = 0, right = 100).</summary>
    public double X { get; set; }

    /// <summary>0..100 (% of field length, own goal = 0, opponent goal = 100).</summary>
    public double Y { get; set; }

    public int SortOrder { get; set; }
}
