namespace FloorballTraining.API.Controllers.Requests;

public class AddVideoLinkRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
}
