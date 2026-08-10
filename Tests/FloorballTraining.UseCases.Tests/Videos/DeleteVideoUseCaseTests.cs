using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Videos;
using NSubstitute;

namespace FloorballTraining.UseCases.Tests.Videos;

public class DeleteVideoUseCaseTests
{
    private readonly IVideoRepository _repository = Substitute.For<IVideoRepository>();
    private readonly DeleteVideoUseCase _useCase;

    public DeleteVideoUseCaseTests() => _useCase = new DeleteVideoUseCase(_repository);

    [Fact]
    public async Task ExecuteAsync_deletes_and_returns_dto_when_owner_matches()
    {
        var video = new Video { Id = 10, ActivityId = 3, VideoType = VideoType.UploadedFile, FilePath = "videos/activity/3/a.mp4" };
        _repository.GetByIdAsync(10).Returns(video);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Activity, ownerId: 3);

        result.Should().NotBeNull();
        result!.Id.Should().Be(10);
        result.FilePath.Should().Be("videos/activity/3/a.mp4");
        await _repository.Received(1).DeleteAsync(video);
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_and_does_not_delete_when_owner_id_differs()
    {
        var video = new Video { Id = 10, ActivityId = 3 };
        _repository.GetByIdAsync(10).Returns(video);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Activity, ownerId: 999);

        result.Should().BeNull();
        await _repository.DidNotReceive().DeleteAsync(Arg.Any<Video>());
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_and_does_not_delete_when_owner_type_differs()
    {
        // Same numeric id, but the video actually belongs to a Training, not an Activity.
        var video = new Video { Id = 10, TrainingId = 3 };
        _repository.GetByIdAsync(10).Returns(video);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Activity, ownerId: 3);

        result.Should().BeNull();
        await _repository.DidNotReceive().DeleteAsync(Arg.Any<Video>());
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_when_video_does_not_exist()
    {
        _repository.GetByIdAsync(404).Returns((Video?)null);

        var result = await _useCase.ExecuteAsync(404, VideoOwnerType.Training, ownerId: 1);

        result.Should().BeNull();
        await _repository.DidNotReceive().DeleteAsync(Arg.Any<Video>());
    }
}
