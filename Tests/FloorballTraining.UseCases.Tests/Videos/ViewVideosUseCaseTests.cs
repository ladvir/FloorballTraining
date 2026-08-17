using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Videos;
using NSubstitute;

namespace FloorballTraining.UseCases.Tests.Videos;

public class ViewVideosUseCaseTests
{
    private readonly IVideoRepository _repository = Substitute.For<IVideoRepository>();
    private readonly ViewVideosUseCase _useCase;

    public ViewVideosUseCaseTests() => _useCase = new ViewVideosUseCase(_repository);

    [Fact]
    public async Task ExecuteAsync_maps_repository_videos_to_dtos()
    {
        var videos = new List<Video>
        {
            new() { Id = 1, TrainingId = 5, VideoType = VideoType.UploadedFile, FilePath = "videos/training/5/a.mp4" },
            new() { Id = 2, TrainingId = 5, VideoType = VideoType.YouTube, Url = "https://youtu.be/abc" },
        };
        _repository.GetByOwnerAsync(VideoOwnerType.Training, 5).Returns(videos);

        var result = await _useCase.ExecuteAsync(VideoOwnerType.Training, 5);

        result.Should().HaveCount(2);
        result[0].Id.Should().Be(1);
        result[0].FilePath.Should().Be("videos/training/5/a.mp4");
        result[1].VideoType.Should().Be(VideoType.YouTube);
        result[1].Url.Should().Be("https://youtu.be/abc");
    }

    [Fact]
    public async Task ExecuteAsync_returns_empty_list_when_owner_has_no_videos()
    {
        _repository.GetByOwnerAsync(VideoOwnerType.Appointment, 9).Returns(new List<Video>());

        var result = await _useCase.ExecuteAsync(VideoOwnerType.Appointment, 9);

        result.Should().BeEmpty();
    }
}
