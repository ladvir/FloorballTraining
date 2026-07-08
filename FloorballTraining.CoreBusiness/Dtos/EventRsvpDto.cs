namespace FloorballTraining.CoreBusiness.Dtos;

public class EventRsvpDto
{
    public int AppointmentId { get; set; }
    public int MemberId { get; set; }
    public string? MemberFirstName { get; set; }
    public string? MemberLastName { get; set; }
    public int Status { get; set; } // 0=Pending, 1=Yes, 2=No, 3=Maybe
    public DateTime? ConfirmedAt { get; set; }
    public string? Note { get; set; }
}

public class EventRsvpUpdateDto
{
    public int Status { get; set; }
    public string? Note { get; set; }
}

public class AppointmentRsvpSummaryDto
{
    public int? MyStatus { get; set; }
    public List<EventRsvpDto> All { get; set; } = [];
    public int CountYes { get; set; }
    public int CountNo { get; set; }
    public int CountMaybe { get; set; }
    public int CountPending { get; set; }
}
