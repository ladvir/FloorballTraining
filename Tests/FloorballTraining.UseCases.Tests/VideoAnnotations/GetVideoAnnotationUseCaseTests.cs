using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.VideoAnnotations;
using NSubstitute;

namespace FloorballTraining.UseCases.Tests.VideoAnnotations;

public class GetVideoAnnotationUseCaseTests
{
    private readonly IVideoRepository _videoRepository = Substitute.For<IVideoRepository>();
    private readonly IVideoAnnotationRepository _annotationRepository = Substitute.For<IVideoAnnotationRepository>();
    private readonly GetVideoAnnotationUseCase _useCase;

    public GetVideoAnnotationUseCaseTests() => _useCase = new GetVideoAnnotationUseCase(_videoRepository, _annotationRepository);

    [Fact]
    public async Task ExecuteAsync_returns_dto_when_owner_matches_and_annotation_exists()
    {
        var video = new Video { Id = 10, ActivityId = 3 };
        _videoRepository.GetByIdAsync(10).Returns(video);
        var annotation = new VideoAnnotation { Id = 1, VideoId = 10, TrimStartMs = 500, TrimEndMs = 4000, DataJson = "{}" };
        _annotationRepository.GetByVideoIdAsync(10).Returns(annotation);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Activity, ownerId: 3);

        result.Should().NotBeNull();
        result!.VideoId.Should().Be(10);
        result.TrimStartMs.Should().Be(500);
        result.DataJson.Should().Be("{}");
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_when_no_annotation_saved_yet()
    {
        var video = new Video { Id = 10, ActivityId = 3 };
        _videoRepository.GetByIdAsync(10).Returns(video);
        _annotationRepository.GetByVideoIdAsync(10).Returns((VideoAnnotation?)null);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Activity, ownerId: 3);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_when_owner_id_differs()
    {
        var video = new Video { Id = 10, ActivityId = 3 };
        _videoRepository.GetByIdAsync(10).Returns(video);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Activity, ownerId: 999);

        result.Should().BeNull();
        await _annotationRepository.DidNotReceive().GetByVideoIdAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_when_owner_type_differs()
    {
        // Same numeric id, but the video actually belongs to a Training, not an Activity.
        var video = new Video { Id = 10, TrainingId = 3 };
        _videoRepository.GetByIdAsync(10).Returns(video);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Activity, ownerId: 3);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_when_video_does_not_exist()
    {
        _videoRepository.GetByIdAsync(404).Returns((Video?)null);

        var result = await _useCase.ExecuteAsync(404, VideoOwnerType.Training, ownerId: 1);

        result.Should().BeNull();
    }
}
