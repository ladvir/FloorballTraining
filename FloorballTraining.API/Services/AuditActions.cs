namespace FloorballTraining.API.Services;

/// <summary>Canonical audit action names. Format: "Area.Event".</summary>
public static class AuditActions
{
    public const string LoginSuccess = "Login.Success";
    public const string LoginFailed = "Login.Failed";
    public const string Logout = "Logout";
    public const string PasswordChanged = "Password.Changed";
    public const string PasswordReset = "Password.Reset";
    public const string EmailChanged = "Email.Changed";

    public const string RoleChanged = "Role.Changed";
    public const string UserCreated = "User.Created";
    public const string UserDeleted = "User.Deleted";
    public const string UserClubMembershipRemoved = "User.ClubMembershipRemoved";

    public const string ActivityCreated = "Activity.Created";
    public const string ActivityUpdated = "Activity.Updated";
    public const string ActivityDeleted = "Activity.Deleted";

    public const string TrainingCreated = "Training.Created";
    public const string TrainingUpdated = "Training.Updated";
    public const string TrainingDeleted = "Training.Deleted";

    public const string AppointmentCreated = "Appointment.Created";
    public const string AppointmentUpdated = "Appointment.Updated";
    public const string AppointmentDeleted = "Appointment.Deleted";

    public const string MemberDeleted = "Member.Deleted";
    public const string ClubDeleted = "Club.Deleted";
}
