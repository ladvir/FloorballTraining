using FloorballTraining.CoreBusiness.Enums;
using Microsoft.AspNetCore.Http;

namespace FloorballTraining.API.Services
{
    public interface IVideoFileStorage
    {
        long MaxBytes { get; }

        /// <summary>Saves the file under wwwroot/videos/{ownerType}/{ownerId}/{guid}.{ext} and returns the relative path.</summary>
        Task<string> SaveAsync(IFormFile file, VideoOwnerType ownerType, int ownerId);

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

            var extension = Path.GetExtension(file.FileName);
            var relativePath = $"{_storageFolder}/{ownerType.ToString().ToLowerInvariant()}/{ownerId}/{Guid.NewGuid():N}{extension}";
            var fullPath = Path.Combine(env.WebRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));

            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            await using var stream = new FileStream(fullPath, FileMode.CreateNew);
            await file.CopyToAsync(stream);

            return relativePath;
        }

        public void Delete(string relativePath)
        {
            var fullPath = Path.Combine(env.WebRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
    }
}
