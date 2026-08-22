using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.VideoAnnotations;
using NSubstitute;

namespace FloorballTraining.UseCases.Tests.VideoAnnotations;

public class SaveVideoAnnotationUseCaseTests
{
    private readonly IVideoRepository _videoRepository = Substitute.For<IVideoRepository>();
    private readonly IVideoAnnotationRepository _annotationRepository = Substitute.For<IVideoAnnotationRepository>();
    private readonly SaveVideoAnnotationUseCase _useCase;

    public SaveVideoAnnotationUseCaseTests() => _useCase = new SaveVideoAnnotationUseCase(_videoRepository, _annotationRepository);

    [Fact]
    public async Task ExecuteAsync_upserts_and_returns_dto_when_owner_matches()
    {
        var video = new Video { Id = 10, TrainingId = 5 };
        _videoRepository.GetByIdAsync(10).Returns(video);
        var saved = new VideoAnnotation { Id = 1, VideoId = 10, TrimStartMs = 100, TrimEndMs = 2000, DataJson = "{\"lines\":[]}" };
        _annotationRepository.UpsertAsync(10, 100, 2000, "{\"lines\":[]}", "user-1").Returns(saved);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Training, ownerId: 5, 100, 2000, "{\"lines\":[]}", "user-1");

        result.Should().NotBeNull();
        result!.VideoId.Should().Be(10);
        result.TrimEndMs.Should().Be(2000);
        await _annotationRepository.Received(1).UpsertAsync(10, 100, 2000, "{\"lines\":[]}", "user-1");
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_and_does_not_upsert_when_owner_id_differs()
    {
        var video = new Video { Id = 10, AppointmentId = 7 };
        _videoRepository.GetByIdAsync(10).Returns(video);

        var result = await _useCase.ExecuteAsync(10, VideoOwnerType.Appointment, ownerId: 999, null, null, "{}", "user-1");

        result.Should().BeNull();
        await _annotationRepository.DidNotReceive().UpsertAsync(Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<string>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task ExecuteAsync_returns_null_when_video_does_not_exist()
    {
        _videoRepository.GetByIdAsync(404).Returns((Video?)null);

        var result = await _useCase.ExecuteAsync(404, VideoOwnerType.Activity, ownerId: 1, null, null, "{}", "user-1");

        result.Should().BeNull();
        await _annotationRepository.DidNotReceive().UpsertAsync(Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<string>(), Arg.Any<string?>());
    }
}
