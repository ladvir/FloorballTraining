using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FluentAssertions;
using Xunit;

namespace FloorballTraining.API.IntegrationTests;

// Pure validation check for Video (#125): exactly one of Activity/Training/Appointment must be set.
public class VideoOwnershipValidationTests
{
    [Fact]
    public void No_owner_is_invalid()
        => new Video().HasExactlyOneOwner().Should().BeFalse();

    [Fact]
    public void Two_owners_is_invalid()
        => new Video { ActivityId = 1, TrainingId = 2 }.HasExactlyOneOwner().Should().BeFalse();

    [Fact]
    public void All_three_owners_is_invalid()
        => new Video { ActivityId = 1, TrainingId = 2, AppointmentId = 3 }.HasExactlyOneOwner().Should().BeFalse();

    [Theory]
    [InlineData(1, null, null)]
    [InlineData(null, 1, null)]
    [InlineData(null, null, 1)]
    public void Exactly_one_owner_is_valid(int? activityId, int? trainingId, int? appointmentId)
        => new Video { ActivityId = activityId, TrainingId = trainingId, AppointmentId = appointmentId }
            .HasExactlyOneOwner().Should().BeTrue();

    [Fact]
    public void UploadedFile_requires_FilePath_not_Url()
    {
        new Video { VideoType = VideoType.UploadedFile, FilePath = "videos/a.mp4" }
            .HasValidUrlOrFilePath().Should().BeTrue();

        new Video { VideoType = VideoType.UploadedFile, Url = "https://youtu.be/x" }
            .HasValidUrlOrFilePath().Should().BeFalse();
    }

    [Fact]
    public void YouTube_requires_Url_not_FilePath()
    {
        new Video { VideoType = VideoType.YouTube, Url = "https://youtu.be/x" }
            .HasValidUrlOrFilePath().Should().BeTrue();

        new Video { VideoType = VideoType.YouTube, FilePath = "videos/a.mp4" }
            .HasValidUrlOrFilePath().Should().BeFalse();
    }
}
