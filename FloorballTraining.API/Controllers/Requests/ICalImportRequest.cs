namespace FloorballTraining.API.Controllers.Requests;

public class ICalImportRequest
{
    public string Url { get; set; } = string.Empty;
    public int TeamId { get; set; }
}
