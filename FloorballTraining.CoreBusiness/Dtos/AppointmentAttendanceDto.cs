namespace FloorballTraining.CoreBusiness.Dtos;

public class AppointmentAttendanceDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int MemberId { get; set; }
    public string? MemberFirstName { get; set; }
    public string? MemberLastName { get; set; }
    public int Status { get; set; }
    public string? Note { get; set; }
    public DateTime RecordedAt { get; set; }
}

public class AttendanceUpsertDto
{
    public int MemberId { get; set; }
    public int Status { get; set; }
    public string? Note { get; set; }
}

public class MemberAttendanceRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string? AppointmentName { get; set; }
    public DateTime AppointmentStart { get; set; }
    public int Status { get; set; }
    public string? Note { get; set; }
}

public class MemberAttendanceSummaryDto
{
    public int MemberId { get; set; }
    public int TotalEvents { get; set; }
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Excused { get; set; }
    public int Unknown { get; set; }
    public int AttendanceRate { get; set; }
    public List<MemberAttendanceRecordDto> RecentRecords { get; set; } = [];
}

public class TeamAttendanceEventDto
{
    public int AppointmentId { get; set; }
    public string? AppointmentName { get; set; }
    public DateTime AppointmentStart { get; set; }
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Excused { get; set; }
    public int Unknown { get; set; }
    public int Total { get; set; }
    public List<AppointmentAttendanceDto> MemberAttendances { get; set; } = [];
}

public class TeamMemberAttendanceSummaryDto
{
    public int MemberId { get; set; }
    public string? MemberFirstName { get; set; }
    public string? MemberLastName { get; set; }
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Excused { get; set; }
    public int Unknown { get; set; }
    public int AttendanceRate { get; set; }
}

public class TeamAttendanceSummaryDto
{
    public int TeamId { get; set; }
    public List<TeamAttendanceEventDto> Events { get; set; } = [];
    public List<TeamMemberAttendanceSummaryDto> Members { get; set; } = [];
}
