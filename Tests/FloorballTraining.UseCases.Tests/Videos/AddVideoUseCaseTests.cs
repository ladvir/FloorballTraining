using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Videos;
using NSubstitute;

namespace FloorballTraining.UseCases.Tests.Videos;

public class AddVideoUseCaseTests
{
    private readonly IVideoRepository _repository = Substitute.For<IVideoRepository>();
    private readonly AddVideoUseCase _useCase;

    public AddVideoUseCaseTests()
    {
        _useCase = new AddVideoUseCase(_repository);
        _repository.AddAsync(Arg.Any<Video>()).Returns(ci =>
        {
            var video = ci.Arg<Video>();
            video.Id = 99;
            return video;
        });
    }

    [Fact]
    public async Task ExecuteFileAsync_sets_owner_type_and_file_path()
    {
        var dto = await _useCase.ExecuteFileAsync(VideoOwnerType.Training, ownerId: 5, "videos/training/5/x.mp4", "Rozcvička", "user-1");

        dto.Id.Should().Be(99);
        dto.VideoType.Should().Be(VideoType.UploadedFile);
        dto.FilePath.Should().Be("videos/training/5/x.mp4");
        dto.Title.Should().Be("Rozcvička");
        dto.CreatedByUserId.Should().Be("user-1");

        await _repository.Received(1).AddAsync(Arg.Is<Video>(v =>
            v.TrainingId == 5 && v.ActivityId == null && v.AppointmentId == null &&
            v.VideoType == VideoType.UploadedFile && v.FilePath == "videos/training/5/x.mp4"));
    }

    [Fact]
    public async Task ExecuteLinkAsync_classifies_link_and_persists_owner()
    {
        var dto = await _useCase.ExecuteLinkAsync(VideoOwnerType.Activity, ownerId: 7, "https://youtu.be/abc123", null, "user-2");

        dto.Should().NotBeNull();
        dto!.VideoType.Should().Be(VideoType.YouTube);
        dto.Url.Should().Be("https://youtu.be/abc123");
        dto.ThumbnailUrl.Should().Be("https://img.youtube.com/vi/abc123/hqdefault.jpg");

        await _repository.Received(1).AddAsync(Arg.Is<Video>(v => v.ActivityId == 7 && v.VideoType == VideoType.YouTube));
    }

    [Fact]
    public async Task ExecuteLinkAsync_returns_null_for_invalid_url_without_persisting()
    {
        var dto = await _useCase.ExecuteLinkAsync(VideoOwnerType.Appointment, ownerId: 1, "not a url", null, "user-3");

        dto.Should().BeNull();
        await _repository.DidNotReceive().AddAsync(Arg.Any<Video>());
    }
}
