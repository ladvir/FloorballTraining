using Microsoft.AspNetCore.Components.Forms;

namespace FloorballTraining.WebApp.Services;

public interface IFileHandlingService
{
    Task<string> CaptureFile(IBrowserFile? file, string activityName = "");
    void Delete(string path, string activityName);
    void DeleteActivityFolder(string activityName);
    void Move(string path, string activityName);

    string CreateActivityDirectory(string activityName = "");
}