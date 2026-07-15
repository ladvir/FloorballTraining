using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Pure helpers for the season plan fast-entry features (no database access).
/// </summary>
public static class PlanningGenerator
{
    /// <summary>
    /// Splits an inclusive date-only span into Monday-aligned week microcycles.
    /// The first and last week may be partial so the whole span is covered exactly.
    /// Names are "{namePrefix} 1..N".
    /// </summary>
    public static List<Microcycle> GenerateWeekMicrocycles(
        DateTime start, DateTime end, MicrocycleType type, string namePrefix)
    {
        start = start.Date;
        end = end.Date;
        if (end < start) return [];

        var result = new List<Microcycle>();
        var current = start;
        var index = 1;

        while (current <= end)
        {
            // Days remaining until Sunday (Monday-aligned weeks)
            var daysToSunday = ((int)DayOfWeek.Sunday - (int)current.DayOfWeek + 7) % 7;
            var weekEnd = current.AddDays(daysToSunday);
            if (weekEnd > end) weekEnd = end;

            result.Add(new Microcycle
            {
                Name = $"{namePrefix} {index}",
                Type = type,
                StartDate = current,
                EndDate = weekEnd
            });

            current = weekEnd.AddDays(1);
            index++;
        }

        return result;
    }
}
