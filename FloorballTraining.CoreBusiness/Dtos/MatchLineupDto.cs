using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class MatchLineupDto : BaseEntityDto
{
    public int TeamId { get; set; }
    public string? TeamName { get; set; }

    public int? AppointmentId { get; set; }
    public string? AppointmentName { get; set; }
    public DateTime? AppointmentStart { get; set; }

    public string Name { get; set; } = null!;

    public int FormationTemplateId { get; set; }
    public FormationTemplateDto? FormationTemplate { get; set; }

    public int FormationCount { get; set; } = 3;
    public bool IsShared { get; set; }

    public string? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<LineupRosterDto> Roster { get; set; } = [];
    public List<LineupFormationDto> Formations { get; set; } = [];
}

public class LineupRosterDto : BaseEntityDto
{
    public int? MemberId { get; set; }
    public string? MemberFirstName { get; set; }
    public string? MemberLastName { get; set; }
    public string? ManualName { get; set; }
    public bool IsAvailable { get; set; } = true;
    public int SortOrder { get; set; }
}

public class LineupFormationDto : BaseEntityDto
{
    public int Index { get; set; }
    public string? Label { get; set; }
    public string ColorKey { get; set; } = "blue";
    public List<LineupSlotDto> Slots { get; set; } = [];
}

public class LineupSlotDto : BaseEntityDto
{
    public SlotPosition Position { get; set; }
    public int? RosterId { get; set; }
}
