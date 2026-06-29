namespace FloorballTraining.CoreBusiness.Dtos;

public class KpiSummaryDto
{
    // Event counts
    public int EventsThisMonth { get; set; }
    public int EventsLast30Days { get; set; }
    public int UpcomingNext30Days { get; set; }
    public Dictionary<int, int> EventsByTypeLast30Days { get; set; } = new();

    // Members
    public int ActiveMembers { get; set; }

    // Ratings
    public double? AvgRatingLast30Days { get; set; }
    public int RatingCountLast30Days { get; set; }

    // Attendance
    public double? AvgAttendancePctLast30Days { get; set; }
    public int EventsWithAttendanceLast30Days { get; set; }

    // Per-event trend (last 20 past events, chronological)
    public List<EventKpiDto> RecentEvents { get; set; } = new();

    // Top 10 members by attendance rate (min 3 events)
    public List<MemberAttendanceKpiDto> TopAttendees { get; set; } = new();
}

public class EventKpiDto
{
    public int AppointmentId { get; set; }
    public string? Name { get; set; }
    public DateTime Start { get; set; }
    public int AppointmentType { get; set; }
    public double? AvgRating { get; set; }
    public int AttendancePresent { get; set; }
    public int AttendanceTotal { get; set; }
    public double? AttendancePct => AttendanceTotal > 0
        ? Math.Round((double)AttendancePresent / AttendanceTotal * 100, 1)
        : null;
}

public class MemberAttendanceKpiDto
{
    public int MemberId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int Present { get; set; }
    public int EventsTotal { get; set; }
    public double AttendancePct { get; set; }
}
