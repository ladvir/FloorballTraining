using Microsoft.AspNetCore.Components.Forms;

namespace FloorballTraining.WebApp.Services;

public interface IFileHandlingService
{
    Task<string> CaptureFile(IBrowserFile? file, string activityName = "");
}