using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class FormationTemplateDto : BaseEntityDto
{
    public int? ClubId { get; set; }
    public string Name { get; set; } = null!;
    public int FormationSize { get; set; }
    public bool IncludesGoalie { get; set; } = true;
    public bool IsBuiltIn { get; set; }

    public List<FormationTemplateSlotDto> Slots { get; set; } = [];
}

public class FormationTemplateSlotDto : BaseEntityDto
{
    public SlotPosition Position { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public int SortOrder { get; set; }
}
