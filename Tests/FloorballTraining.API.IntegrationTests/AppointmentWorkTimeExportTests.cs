using ClosedXML.Excel;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Services;
using FluentAssertions;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Výkaz práce (work-report) Excel generation: all matches played on the same day must collapse
/// into a single fixed 10:00–12:00 (2h) row, regardless of how many matches were scheduled that day.
/// Pure unit test on <see cref="AppointmentService"/> — no DB, no WebApplicationFactory.
/// </summary>
public class AppointmentWorkTimeExportTests
{
    private readonly AppointmentService _service = new();

    [Fact]
    public async Task SingleCoachWorkbook_MergesSameDayMatches_IntoOneFixedTwoHourRow()
    {
        var day = new DateTime(2026, 3, 1); // day 1 of the month -> predictable, first data row (4)
        var exportData = new AppointmentsExportDto
        {
            TeamName = "Test Team",
            CoachName = "Test Coach",
            Appointments =
            [
                new AppointmentDto { AppointmentType = AppointmentType.Match, Start = day.AddHours(9), End = day.AddHours(10), Name = "vs A", LocationName = "Hala 1" },
                new AppointmentDto { AppointmentType = AppointmentType.Match, Start = day.AddHours(14), End = day.AddHours(15), Name = "vs B", LocationName = "Hala 1" },
            ],
        };

        var bytes = await _service.GenerateSingleCoachWorkbook(exportData, day.Year, day.Month);
        using var workbook = new XLWorkbook(new MemoryStream(bytes));
        var worksheet = workbook.Worksheet(1);

        const int day1Row = 4; // rowIndexFirstData; day.Day == 1 lands exactly here
        worksheet.Cell(day1Row, 3).GetString().Should().Be("vs A, vs B"); // merged description, one row for both matches
        worksheet.Cell(day1Row, 2).GetString().Should().Be("Hala 1");
        worksheet.Cell(day1Row, 8).GetString().Should().Be("10:00");
        worksheet.Cell(day1Row, 9).GetString().Should().Be("12:00");
        worksheet.Cell(day1Row, 10).GetDouble().Should().Be(2);

        // Day 2 has no events — if the second match had leaked its own row, day 2's label would
        // have been pushed down past row 5.
        worksheet.Cell(day1Row + 1, 1).GetDouble().Should().Be(2);
    }
}
