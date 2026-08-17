namespace FloorballTraining.API.Errors;

public class ApiException(int statusCode, string? message = null, string? details = null, string? traceId = null)
    : ApiResponse(statusCode, message)
{
    public string? Details { get; set; } = details;
    public string? TraceId { get; set; } = traceId;
}
