namespace FloorballTraining.CoreBusiness.Dtos;

public class AppointmentMemberAssignmentDto
{
    public int Id { get; set; }
    public int MemberId { get; set; }
    public string? MemberFirstName { get; set; }
    public string? MemberLastName { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}
