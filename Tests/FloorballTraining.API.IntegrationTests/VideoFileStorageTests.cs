using System.Text;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;

namespace FloorballTraining.API.IntegrationTests;

// #126: disk storage service for uploaded videos. No DB/WebApplicationFactory involved,
// so this runs as a plain unit test against a temp directory standing in for wwwroot.
public class VideoFileStorageTests : IDisposable
{
    private readonly string _webRoot = Path.Combine(Path.GetTempPath(), "flotr-video-tests-" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(_webRoot))
            Directory.Delete(_webRoot, recursive: true);
    }

    private IVideoFileStorage CreateStorage(long? maxVideoBytes = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(maxVideoBytes is null
                ? []
                : new Dictionary<string, string?> { ["FileUpload:MaxVideoBytes"] = maxVideoBytes.ToString() })
            .Build();

        return new VideoFileStorage(new FakeWebHostEnvironment(_webRoot), config);
    }

    private static IFormFile CreateFormFile(string content, string fileName = "clip.mp4")
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", fileName);
    }

    [Fact]
    public async Task SaveAsync_writes_file_under_owner_folder_and_returns_relative_path()
    {
        var storage = CreateStorage();
        var file = CreateFormFile("fake video bytes");

        var relativePath = await storage.SaveAsync(file, VideoOwnerType.Activity, ownerId: 42);

        relativePath.Should().StartWith("videos/activity/42/");
        relativePath.Should().EndWith(".mp4");
        File.Exists(Path.Combine(_webRoot, relativePath.Replace('/', Path.DirectorySeparatorChar))).Should().BeTrue();
    }

    [Fact]
    public async Task SaveAsync_generates_unique_paths_for_repeated_uploads()
    {
        var storage = CreateStorage();

        var first = await storage.SaveAsync(CreateFormFile("a"), VideoOwnerType.Training, ownerId: 1);
        var second = await storage.SaveAsync(CreateFormFile("b"), VideoOwnerType.Training, ownerId: 1);

        first.Should().NotBe(second);
    }

    [Fact]
    public async Task SaveAsync_throws_when_file_exceeds_configured_max_size()
    {
        var storage = CreateStorage(maxVideoBytes: 5);
        var file = CreateFormFile("this is way more than five bytes");

        var act = () => storage.SaveAsync(file, VideoOwnerType.Appointment, ownerId: 1);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Delete_removes_the_physical_file()
    {
        var storage = CreateStorage();
        var relativePath = await storage.SaveAsync(CreateFormFile("gone soon"), VideoOwnerType.Activity, ownerId: 7);
        var fullPath = Path.Combine(_webRoot, relativePath.Replace('/', Path.DirectorySeparatorChar));
        File.Exists(fullPath).Should().BeTrue();

        storage.Delete(relativePath);

        File.Exists(fullPath).Should().BeFalse();
    }

    [Fact]
    public void Delete_is_a_noop_when_file_does_not_exist()
    {
        var storage = CreateStorage();

        var act = () => storage.Delete("videos/activity/1/missing.mp4");

        act.Should().NotThrow();
    }

    private sealed class FakeWebHostEnvironment(string webRootPath) : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = webRootPath;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ApplicationName { get; set; } = "Tests";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = webRootPath;
        public string EnvironmentName { get; set; } = "Test";
    }
}
