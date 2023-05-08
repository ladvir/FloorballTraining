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
            var path = GetActivityPath(activityName);

            Directory.CreateDirectory(path);

            return path;
        }

        public void Delete(string fileName, string activityName = "")
        {
            var fileForDelete = Path.Combine(GetActivityPath(Path.GetDirectoryName(fileName)!), Path.GetFileName(fileName));

            File.Delete(fileForDelete);
        }

        public void DeleteActivityFolder(string activityName)
        {
            var folderForDelete = GetActivityPath(GetValidFolderName(activityName));

            if (Directory.Exists(folderForDelete))
            {
                Directory.Delete(folderForDelete, true);
            }
        }

        public void Move(string path, string activityName)
        {
            var currentDirectory = Path.GetDirectoryName(path);


            var currentLocation = Path.Combine(CreateActivityDirectory(""), path);



            var newLocation = Path.Combine(string.IsNullOrEmpty(currentDirectory) ? CreateActivityDirectory(GetValidFolderName(activityName)) : GetStoragePath(), path);

            File.Move(currentLocation, newLocation);
        }

        public string GetActivityPath(string activityFolderName)
        {
            return Path.Combine(GetStoragePath(), activityFolderName);
        }

        public string GetStoragePath()
        {
            return Path.Combine("wwwroot", _storageLocation);
        }


    }
}
