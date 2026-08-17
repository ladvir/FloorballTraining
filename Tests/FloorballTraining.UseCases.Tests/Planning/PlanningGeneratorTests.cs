using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.Tests.Planning;

public class PlanningGeneratorTests
{
    // 2026-07-06 is a Monday
    private static readonly DateTime Monday = new(2026, 7, 6);

    [Fact]
    public void Monday_aligned_span_produces_full_weeks()
    {
        // 4 exact weeks: Mon 6.7. – Sun 2.8.
        var weeks = PlanningGenerator.GenerateWeekMicrocycles(
            Monday, new DateTime(2026, 8, 2), MicrocycleType.Development, "Týden");

        weeks.Should().HaveCount(4);
        weeks.Should().OnlyContain(w => w.StartDate.DayOfWeek == DayOfWeek.Monday
                                        && w.EndDate.DayOfWeek == DayOfWeek.Sunday);
        weeks.Select(w => w.Name).Should().ContainInOrder("Týden 1", "Týden 2", "Týden 3", "Týden 4");
        weeks.Should().OnlyContain(w => w.Type == MicrocycleType.Development);
    }

    [Fact]
    public void Midweek_start_and_end_produce_partial_edge_weeks()
    {
        // Wed 8.7. – Tue 21.7.: Wed–Sun, Mon–Sun, Mon–Tue
        var weeks = PlanningGenerator.GenerateWeekMicrocycles(
            new DateTime(2026, 7, 8), new DateTime(2026, 7, 21), MicrocycleType.Stabilization, "Week");

        weeks.Should().HaveCount(3);
        weeks[0].StartDate.Should().Be(new DateTime(2026, 7, 8));
        weeks[0].EndDate.Should().Be(new DateTime(2026, 7, 12)); // first Sunday
        weeks[1].StartDate.Should().Be(new DateTime(2026, 7, 13));
        weeks[1].EndDate.Should().Be(new DateTime(2026, 7, 19));
        weeks[2].StartDate.Should().Be(new DateTime(2026, 7, 20));
        weeks[2].EndDate.Should().Be(new DateTime(2026, 7, 21)); // clipped to span end
    }

    [Fact]
    public void Weeks_cover_the_span_exactly_without_gaps_or_overlaps()
    {
        var start = new DateTime(2026, 7, 8);
        var end = new DateTime(2026, 9, 3);
        var weeks = PlanningGenerator.GenerateWeekMicrocycles(
            start, end, MicrocycleType.Development, "W");

        weeks.First().StartDate.Should().Be(start);
        weeks.Last().EndDate.Should().Be(end);
        for (var i = 1; i < weeks.Count; i++)
            weeks[i].StartDate.Should().Be(weeks[i - 1].EndDate.AddDays(1));
    }

    [Fact]
    public void Single_day_mesocycle_produces_one_single_day_week()
    {
        var day = new DateTime(2026, 7, 9); // Thursday
        var weeks = PlanningGenerator.GenerateWeekMicrocycles(
            day, day, MicrocycleType.Regeneration, "Týden");

        weeks.Should().ContainSingle();
        weeks[0].StartDate.Should().Be(day);
        weeks[0].EndDate.Should().Be(day);
        weeks[0].Name.Should().Be("Týden 1");
    }

    [Fact]
    public void Sunday_start_produces_one_day_first_week()
    {
        // Sunday 12.7. → first "week" is just that Sunday
        var weeks = PlanningGenerator.GenerateWeekMicrocycles(
            new DateTime(2026, 7, 12), new DateTime(2026, 7, 19), MicrocycleType.Competition, "T");

        weeks.Should().HaveCount(2);
        weeks[0].StartDate.Should().Be(weeks[0].EndDate);
        weeks[1].StartDate.Should().Be(new DateTime(2026, 7, 13));
    }

    [Fact]
    public void End_before_start_returns_empty()
    {
        var weeks = PlanningGenerator.GenerateWeekMicrocycles(
            new DateTime(2026, 7, 10), new DateTime(2026, 7, 9), MicrocycleType.Development, "T");

        weeks.Should().BeEmpty();
    }

    [Fact]
    public void Time_components_are_stripped()
    {
        var weeks = PlanningGenerator.GenerateWeekMicrocycles(
            new DateTime(2026, 7, 6, 13, 45, 0), new DateTime(2026, 7, 12, 8, 0, 0),
            MicrocycleType.Development, "T");

        weeks.Should().ContainSingle();
        weeks[0].StartDate.Should().Be(new DateTime(2026, 7, 6));
        weeks[0].EndDate.Should().Be(new DateTime(2026, 7, 12));
    }
}
