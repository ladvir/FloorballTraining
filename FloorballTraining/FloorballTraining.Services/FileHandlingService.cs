using FloorballTraining.Extensions;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.Extensions.Configuration;


namespace FloorballTraining.Services
{
    public class FileHandlingService : IFileHandlingService
    {
        private const long MaxFileSize = 1024 * 1024 * 5; // represents 5MB

        private readonly string _storageLocation;

        public FileHandlingService(IConfiguration configuration)
        {
            _storageLocation = Path.Combine("wwwroot", configuration["FileStorage"] ?? "storage");
        }

        public async Task<string> CaptureFile(IBrowserFile? file, string activityName = "")
        {
            if (file is null)
            {
                return string.Empty;
            }

            try
            {
                activityName = GetValidFolderName(activityName);

                string newFileName = Path.ChangeExtension(Path.GetRandomFileName(), Path.GetExtension(file.Name));

                string path = CreateActivityDirectory(activityName);

                string relativePath = Path.Combine(activityName, newFileName);

                await using FileStream fs = new(Path.Combine(path, newFileName), FileMode.Create);
                await file.OpenReadStream(MaxFileSize).CopyToAsync(fs);

                return relativePath;
            }
            catch (Exception ex)
            {
                throw new Exception($"File: {file.Name} Error: {ex.Message}");
            }
        }

        private static string GetValidFolderName(string activityName)
        {
            //get rid of unsupported characters
            foreach (var c in Path.GetInvalidFileNameChars())
            {
                activityName = activityName.Replace(c.ToString(), ((int)c).ToString());
            }

            return activityName;
        }

        public string CreateActivityDirectory(string activityName = "")
        {
            var path = GetActivityFolder(activityName);

            Directory.CreateDirectory(path);

            return path;
        }

        public void CopyActivityDirectory(string sourceActivityName, string destinationActivityName)
        {
            var sourceDir = new DirectoryInfo(GetActivityFolder(sourceActivityName));

            if (!sourceDir.Exists)
            {
                return;
            }

            sourceDir.DeepCopy(destinationActivityName);
        }

        public string GetActivityFolder(string activityName = "")
        {
            return Path.Combine(_storageLocation, GetValidFolderName(activityName));
        }

        public void Delete(string fileName, string activityName = "")
        {
            var fileForDelete = Path.Combine(_storageLocation, fileName);
            if (File.Exists(fileForDelete))
            {
                File.Delete(fileForDelete);
            }
        }

        public void DeleteActivityFolder(string activityName)
        {
            var folderForDelete = GetActivityFolder(activityName);

            if (Directory.Exists(folderForDelete))
            {
                Directory.Delete(folderForDelete, true);
            }
        }

        public void Move(string path, string activityName)
        {
            var fileName = Path.GetFileName(path);

            var currentLocation = Path.Combine(_storageLocation, path);

            var newLocation = Path.Combine(_storageLocation, GetValidFolderName(activityName), fileName);

            if (!Directory.Exists(Path.GetDirectoryName(newLocation)))
            {
                Directory.CreateDirectory(Path.GetDirectoryName(newLocation)!);
            }


            if (File.Exists(currentLocation))
            {
                File.Move(currentLocation, newLocation);
            }
        }


    }
}
