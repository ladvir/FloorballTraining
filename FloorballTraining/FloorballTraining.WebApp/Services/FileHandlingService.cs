using Microsoft.AspNetCore.Components.Forms;

namespace FloorballTraining.WebApp.Services
{
    public class FileHandlingService : IFileHandlingService
    {
        private const long MaxFileSize = 1024 * 1024 * 5; // represents 5MB

        private readonly string _storageLocation;

        public FileHandlingService(IConfiguration configuration)
        {
            _storageLocation = configuration.GetValue<string>("Storage") ?? "storage";
        }

        public async Task<string> CaptureFile(IBrowserFile? file, string activityName = "")
        {
            if (file is null)
            {
                return string.Empty;
            }

            try
            {
                //get rid of unsupported characters
                foreach (var c in Path.GetInvalidFileNameChars())
                {
                    activityName = activityName.Replace(c.ToString(), ((int)c).ToString());
                }


                string newFileName = Path.ChangeExtension(Path.GetRandomFileName(), Path.GetExtension(file.Name));

                string path = GetActivityPath(activityName);

                string relativePath = Path.Combine(activityName, newFileName);

                Directory.CreateDirectory(path);

                await using FileStream fs = new(Path.Combine(path, newFileName), FileMode.Create);
                await file.OpenReadStream(MaxFileSize).CopyToAsync(fs);

                return relativePath;
            }
            catch (Exception ex)
            {
                throw new Exception($"File: {file.Name} Error: {ex.Message}");
            }
        }


        private string GetActivityPath(string activityFolder)
        {
            return Path.Combine("wwwroot", _storageLocation, activityFolder);
        }
    }
}
