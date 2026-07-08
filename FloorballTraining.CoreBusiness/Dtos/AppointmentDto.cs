using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class AppointmentDto : BaseEntityDto
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public AppointmentType AppointmentType { get; set; }

    public int LocationId { get; set; }

    public string? LocationName { get; set; }

    public RepeatingPatternDto? RepeatingPattern { get; set; }

    public AppointmentDto? ParentAppointment { get; set; }

    public List<AppointmentDto> FutureAppointments { get; set; } = [];
    public bool IsPast { get; set; }

    public int? TeamId { get; set; }
    public string? OwnerUserId { get; set; }
    public string? OwnerUserName { get; set; }
    public int? TrainingId { get; set; }
    public string? TrainingName { get; set; }
    
    public string? TrainingTargets { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }

    /// <summary>Test ids selected for a Testing event (write).</summary>
    public List<int> TestDefinitionIds { get; set; } = [];

    /// <summary>Selected tests with names for display (read).</summary>
    public List<AppointmentTestRefDto> Tests { get; set; } = [];

    /// <summary>Member IDs to assign to this appointment (write).</summary>
    public List<int> AssignedMemberIds { get; set; } = [];

    /// <summary>Full assignment list with completion status (read).</summary>
    public List<AppointmentMemberAssignmentDto> MemberAssignments { get; set; } = [];

    /// <summary>True when the current user is in the assignment list (read, server-populated).</summary>
    public bool IsAssignedToMe { get; set; }

    /// <summary>Completion status for the current user's assignment (null = not assigned).</summary>
    public bool? MyAssignmentCompleted { get; set; }


    public void Merge(AppointmentDto e)
    {
        Name = e.Name;
        Description = e.Description;
        AppointmentType = e.AppointmentType;
        Start = e.Start;
        End = e.End;
        RepeatingPattern = e.RepeatingPattern;
        LocationId = e.LocationId;
        TeamId = e.TeamId;
        OwnerUserId = e.OwnerUserId;
        TrainingId = e.TrainingId;
        TrainingName = e.TrainingName;
        TrainingTargets = e.TrainingTargets;
        TestDefinitionIds = e.TestDefinitionIds;

        FutureAppointments = e.FutureAppointments;
    }

    public void MergeFlat(AppointmentDto e)
    {
        Name = e.Name;
        Description = e.Description;
        AppointmentType = e.AppointmentType;
        Start = e.Start;
        End = e.End;
        RepeatingPattern = e.RepeatingPattern;
        LocationId = e.LocationId;
        TeamId = e.TeamId;
        OwnerUserId = e.OwnerUserId;
        TrainingId = e.TrainingId;
        TestDefinitionIds = e.TestDefinitionIds;
    }
}

public class AppointmentTestRefDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}