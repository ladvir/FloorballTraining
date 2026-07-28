using FloorballTraining.API.Infrastructure;
using FloorballTraining.CoreBusiness;
using FluentAssertions;
using Xunit;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Guards the trigger set that decides when a write enqueues an XP/badge recompute. Also the loop
/// guard: XpEvent/MemberBadge (what the recompute itself writes) must NOT be sources, or the job's
/// own save would re-trigger endlessly.
/// </summary>
public class GamificationRecomputeInterceptorTests
{
    [Fact]
    public void IsXpSource_true_for_the_source_records()
    {
        GamificationRecomputeInterceptor.IsXpSource(new AppointmentAttendance()).Should().BeTrue();
        GamificationRecomputeInterceptor.IsXpSource(new StatTrackerEntry()).Should().BeTrue();
        GamificationRecomputeInterceptor.IsXpSource(new PlayerSkillRating()).Should().BeTrue();
        GamificationRecomputeInterceptor.IsXpSource(new TestResult()).Should().BeTrue();
        GamificationRecomputeInterceptor.IsXpSource(new XpCoachAward()).Should().BeTrue(); // layer B (#100)
    }

    [Fact]
    public void IsXpSource_false_for_recompute_outputs_and_others()
    {
        // Loop guard: the job writes these — they must never re-trigger it.
        GamificationRecomputeInterceptor.IsXpSource(new XpEvent()).Should().BeFalse();
        GamificationRecomputeInterceptor.IsXpSource(new MemberBadge()).Should().BeFalse();
        GamificationRecomputeInterceptor.IsXpSource(new Member()).Should().BeFalse();
    }
}
