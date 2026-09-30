namespace FloorballTraining.CoreBusiness.Dtos;

// EOS attendance bulk import: analyze (parse + match) is fully stateless — the whole parsed
// result round-trips through the frontend and comes back as a commit request augmented with
// the coach's manual resolutions. No server-side temp storage between the two calls.

public class AttendanceImportAnalyzeResultDto
{
    public List<AttendanceImportEventDto> Events { get; set; } = [];
    public List<string> ParseErrors { get; set; } = [];
}

public class AttendanceImportEventDto
{
    public string EventTypeRaw { get; set; } = "";
    public string? EventName { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public int? MatchedAppointmentId { get; set; }
    public string? MatchedAppointmentName { get; set; }
    public List<AttendanceImportCandidateAppointmentDto> CandidateAppointments { get; set; } = [];
    public List<AttendanceImportMemberRowDto> Members { get; set; } = [];
}

public class AttendanceImportCandidateAppointmentDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public int AppointmentType { get; set; }
    public DateTime Start { get; set; }
}

public class AttendanceImportMemberRowDto
{
    public string NameRaw { get; set; } = "";
    public bool Attended { get; set; }
    public int? MatchedMemberId { get; set; }
    public string? MatchedMemberName { get; set; }
    public int? SuggestedClubMemberId { get; set; }
    public string? SuggestedClubMemberName { get; set; }
    public AppointmentAttendanceDto? Existing { get; set; }
}

public enum AttendanceImportMemberAction
{
    Skip,
    UseExisting,
    CreateNew,
}

public class AttendanceImportCommitRequestDto
{
    public List<AttendanceImportEventCommitDto> Events { get; set; } = [];
}

public class AttendanceImportEventCommitDto
{
    /// <summary>Set = use this existing appointment (either auto-matched or manually picked from candidates).</summary>
    public int? AppointmentId { get; set; }
    /// <summary>True when AppointmentId was manually picked from candidates — the target appointment's
    /// Name/Start/End/Type get overwritten from the imported Excel event.</summary>
    public bool SyncAppointmentFromImport { get; set; }
    /// <summary>Create a brand-new Appointment from the fields below instead of using an existing one.</summary>
    public bool CreateNewAppointment { get; set; }
    public string EventTypeRaw { get; set; } = "";
    public string? EventName { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    /// <summary>Single per-event toggle: overwrite every already-recorded attendance row for this
    /// appointment, instead of resolving each conflicting member individually.</summary>
    public bool UpdateAllExistingAttendance { get; set; }
    public List<AttendanceImportMemberCommitDto> Members { get; set; } = [];
}

public class AttendanceImportMemberCommitDto
{
    public string NameRaw { get; set; } = "";
    public bool Attended { get; set; }
    public AttendanceImportMemberAction Action { get; set; }
    public int? MemberId { get; set; }
    public string? NewFirstName { get; set; }
    public string? NewLastName { get; set; }
}

public class AttendanceImportCommitResultDto
{
    public int EventsMatched { get; set; }
    public int EventsSkipped { get; set; }
    public int AppointmentsCreated { get; set; }
    public int AppointmentsSynced { get; set; }
    public int MembersCreated { get; set; }
    public int MembersAddedToTeam { get; set; }
    public int AttendanceCreated { get; set; }
    public int AttendanceUpdated { get; set; }
    public int AttendanceSkippedConflict { get; set; }
    public int AttendanceSkippedByChoice { get; set; }
    public List<string> Errors { get; set; } = [];
}
