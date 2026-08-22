namespace FloorballTraining.API.Controllers.Requests;

public class SaveVideoAnnotationRequest
{
    public int? TrimStartMs { get; set; }
    public int? TrimEndMs { get; set; }
    public string DataJson { get; set; } = string.Empty;
}
