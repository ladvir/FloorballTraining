using FloorballTraining.API.Services;
using FluentAssertions;
using Xunit;

namespace FloorballTraining.API.IntegrationTests;

public class AttendanceForgivenessTests
{
    private static readonly DateTime D = new(2026, 10, 5);

    private static AttendanceForgiveness.Rec R(int apptId, int team, int fromH, int toH, int status, int member = 1, int dayOffset = 0) =>
        new(member, apptId, team, D.AddDays(dayOffset).AddHours(fromH), D.AddDays(dayOffset).AddHours(toH), status);

    [Fact]
    public void SingleTrainingPerTeam_SameDay_AbsenceForgiven()
    {
        var f = AttendanceForgiveness.Forgiven([R(1, 10, 17, 18, 2), R(2, 20, 18, 19, 1)]);
        f.Should().BeEquivalentTo([(1, 1)]);
    }

    [Fact]
    public void AbsentInBoth_NotForgiven()
    {
        AttendanceForgiveness.Forgiven([R(1, 10, 17, 18, 2), R(2, 20, 17, 18, 0)]).Should().BeEmpty();
    }

    [Fact]
    public void MultiPhase_RequiresTimeOverlap()
    {
        // team 10 has two phases; present at team 20 only 17-18 -> only the overlapping phase is forgiven
        var f = AttendanceForgiveness.Forgiven([
            R(1, 10, 17, 18, 2), R(2, 10, 19, 20, 2), R(3, 20, 17, 18, 1)]);
        f.Should().BeEquivalentTo([(1, 1)]);
    }

    [Fact]
    public void OtherDay_NotForgiven()
    {
        AttendanceForgiveness.Forgiven([R(1, 10, 17, 18, 2), R(2, 20, 17, 18, 1, dayOffset: 1)]).Should().BeEmpty();
    }
}
