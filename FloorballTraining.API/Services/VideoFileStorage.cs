using FloorballTraining.CoreBusiness.Enums;
using Microsoft.AspNetCore.Http;

namespace FloorballTraining.API.Services
{
    public interface IVideoFileStorage
    {
        long MaxBytes { get; }

        /// <summary>Saves the file under wwwroot/videos/{ownerType}/{ownerId}/{guid}.{ext} and returns the relative path.</summary>
        Task<string> SaveAsync(IFormFile file, VideoOwnerType ownerType, int ownerId);

        /// <summary>
        /// Moves a server-generated file (e.g. a burned-in export, #141) into the same storage
        /// layout SaveAsync uses, without the IFormFile-upload size/stream ceremony. The source
        /// file no longer exists afterwards.
        /// </summary>
        Task<string> AdoptGeneratedFileAsync(string sourceFilePath, string extension, VideoOwnerType ownerType, int ownerId);

        /// <summary>Deletes the file at the given relative path (as returned by SaveAsync). No-op if it's already gone.</summary>
        void Delete(string relativePath);
    }

    public class VideoFileStorage(IWebHostEnvironment env, IConfiguration configuration) : IVideoFileStorage
    {
        private readonly string _storageFolder = configuration["FileUpload:VideoStoragePath"] ?? "videos";

        public long MaxBytes { get; } = configuration.GetValue<long?>("FileUpload:MaxVideoBytes") ?? 200L * 1024 * 1024;

        public async Task<string> SaveAsync(IFormFile file, VideoOwnerType ownerType, int ownerId)
        {
            if (file.Length > MaxBytes)
                throw new InvalidOperationException($"Video exceeds max allowed size of {MaxBytes} bytes.");

            var fullPath = BuildDestinationPath(ownerType, ownerId, Path.GetExtension(file.FileName), out var relativePath);

            await using var stream = new FileStream(fullPath, FileMode.CreateNew);
            await file.CopyToAsync(stream);

            return relativePath;
        }

        public Task<string> AdoptGeneratedFileAsync(string sourceFilePath, string extension, VideoOwnerType ownerType, int ownerId)
        {
            var fullPath = BuildDestinationPath(ownerType, ownerId, extension, out var relativePath);
            File.Move(sourceFilePath, fullPath);
            return Task.FromResult(relativePath);
        }

        public void Delete(string relativePath)
        {
            var fullPath = Path.Combine(env.WebRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }

        private string BuildDestinationPath(VideoOwnerType ownerType, int ownerId, string extension, out string relativePath)
        {
            relativePath = $"{_storageFolder}/{ownerType.ToString().ToLowerInvariant()}/{ownerId}/{Guid.NewGuid():N}{extension}";
            var fullPath = Path.Combine(env.WebRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
            return fullPath;
        }
    }
}
