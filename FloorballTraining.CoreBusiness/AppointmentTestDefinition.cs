namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Join entity linking a testing <see cref="Appointment"/> to the <see cref="TestDefinition"/>s
/// that are planned to be measured during that event.
/// </summary>
public class AppointmentTestDefinition : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public int TestDefinitionId { get; set; }
    public TestDefinition? TestDefinition { get; set; }
}
