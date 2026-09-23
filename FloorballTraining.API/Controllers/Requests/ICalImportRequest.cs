using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.API.Controllers.Requests;

public class ICalImportRequest
{
    public string Url { get; set; } = string.Empty;
    public int TeamId { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public List<AppointmentType>? Types { get; set; }
}

public class ICalImportFilterRequest
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public List<AppointmentType>? Types { get; set; }
}
