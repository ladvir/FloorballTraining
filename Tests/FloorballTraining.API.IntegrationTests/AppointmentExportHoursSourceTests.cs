using System.Security.Claims;
using ClosedXML.Excel;
using FloorballTraining.API.Controllers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Výkaz práce export: hoursSource=plan (default) counts every scheduled team event;
/// hoursSource=attendance counts only team events with a recorded attendance entry.
/// Drives the real <see cref="AppointmentsController"/> with a coach principal scoped to one
/// team, so the shared test DB's unrelated appointments (other clubs/teams) can't leak in.
/// </summary>
[Collection("Api")]
public class AppointmentExportHoursSourceTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly DateTime _start = new(2026, 3, 5, 18, 0, 0, DateTimeKind.Utc);
    private string _coachUserId = "";
    private int _appointmentId;
    private int _memberId;

    public async Task InitializeAsync()
    {
        var coachUserId = Guid.NewGuid().ToString();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"ExportClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();

        var team = new Team { Name = $"ExportTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        db.Users.Add(new AppUser { Id = coachUserId, UserName = $"u-{coachUserId}", Email = $"{coachUserId}@t.cz", FirstName = "Export", LastName = "Coach" });
        var coachMember = new Member { FirstName = "Export", LastName = "Coach", BirthYear = 1990, ClubId = club.Id, AppUserId = coachUserId };
        db.Members.Add(coachMember);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = team.Id, MemberId = coachMember.Id, IsCoach = true });

        var player = new Member { FirstName = "Export", LastName = "Player", BirthYear = 2010, ClubId = club.Id };
        db.Members.Add(player);
        await db.SaveChangesAsync();
        _memberId = player.Id;

        var training = new Appointment
        {
            AppointmentType = AppointmentType.Training,
            Start = _start,
            End = _start.AddHours(1.5),
            LocationId = 1,
            TeamId = team.Id,
        };
        db.Appointments.Add(training);
        await db.SaveChangesAsync();
        _appointmentId = training.Id;
        _coachUserId = coachUserId;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private AppointmentsController Controller(IServiceProvider sp)
    {
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, _coachUserId)], "TestAuth"));
        var controller = ActivatorUtilities.CreateInstance<AppointmentsController>(sp);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } };
        return controller;
    }

    [Fact]
    public async Task PlanSource_IncludesScheduledEvent_EvenWithoutRecordedAttendance()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var result = await Controller(scope.ServiceProvider)
            .ExportWorkTime(_start.Year, _start.Month, hoursSource: "plan");

        var file = result.Should().BeOfType<FileContentResult>().Subject;
        file.FileContents.Should().NotBeEmpty();
    }

    [Fact]
    public async Task AttendanceSource_ExcludesTeamEvent_WithNoRecordedAttendance()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var result = await Controller(scope.ServiceProvider)
            .ExportWorkTime(_start.Year, _start.Month, hoursSource: "attendance");

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task AttendanceSource_IncludesTeamEvent_OnceAttendanceIsRecorded()
    {
        await using (var seedScope = factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            db.AppointmentAttendances.Add(new AppointmentAttendance
            {
                AppointmentId = _appointmentId,
                MemberId = _memberId,
                Status = 1,
                RecordedByUserId = _coachUserId,
            });
            await db.SaveChangesAsync();
        }

        await using var scope = factory.Services.CreateAsyncScope();
        var result = await Controller(scope.ServiceProvider)
            .ExportWorkTime(_start.Year, _start.Month, hoursSource: "attendance");

        var file = result.Should().BeOfType<FileContentResult>().Subject;
        file.FileContents.Should().NotBeEmpty();
    }

    [Fact]
    public async Task PreparationHours_FormOverride_IsWrittenIntoTheReport_InsteadOfTheComputedZero()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var result = await Controller(scope.ServiceProvider)
            .ExportWorkTime(_start.Year, _start.Month, hoursSource: "plan", preparationHours: 3.5);

        var file = result.Should().BeOfType<FileContentResult>().Subject;
        ReadPreparationHoursCell(file.FileContents).Should().Be(3.5);
    }

    [Fact]
    public async Task PreparationHours_WhenOmitted_FallsBackToComputedValue()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var result = await Controller(scope.ServiceProvider)
            .ExportWorkTime(_start.Year, _start.Month, hoursSource: "plan");

        var file = result.Should().BeOfType<FileContentResult>().Subject;
        // No "Preparation"-type appointment was seeded, so the auto-computed total is 0.
        ReadPreparationHoursCell(file.FileContents).Should().Be(0);
    }

    [Fact]
    public async Task GetPreparationHours_ReturnsZero_WhenNoPreparationAppointmentExists()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var result = await Controller(scope.ServiceProvider).GetPreparationHours(_start.Year, _start.Month);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { hours = 0.0 });
    }

    [Fact]
    public async Task GetPreparationHours_SumsOnlyTheCallersOwnPreparationAppointments()
    {
        await using (var seedScope = factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            db.Appointments.Add(new Appointment
            {
                AppointmentType = AppointmentType.Preparation,
                Start = _start.AddDays(1),
                End = _start.AddDays(1).AddHours(2.5),
                LocationId = 1,
                OwnerUserId = _coachUserId,
            });
            // A different owner's Preparation event in the same month must not be counted.
            db.Appointments.Add(new Appointment
            {
                AppointmentType = AppointmentType.Preparation,
                Start = _start.AddDays(2),
                End = _start.AddDays(2).AddHours(10),
                LocationId = 1,
                OwnerUserId = Guid.NewGuid().ToString(),
            });
            await db.SaveChangesAsync();
        }

        await using var scope = factory.Services.CreateAsyncScope();
        var result = await Controller(scope.ServiceProvider).GetPreparationHours(_start.Year, _start.Month);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { hours = 2.5 });
    }

    /// <summary>
    /// Column H of the "Příprava" summary row. Found by its known position rather than by scanning
    /// cells: with a single non-multi-event day in the month, the day rows run from row 4 through
    /// row 4+DaysInMonth-1, "Celkem" sits right after, and "Příprava" is the row after that. Scanning
    /// (e.g. CellsUsed + GetString) would force ClosedXML to evaluate every formula cell on the sheet,
    /// including a pre-existing malformed one in the "Pořádání" row — unrelated to this test.
    /// </summary>
    private double ReadPreparationHoursCell(byte[] workbookBytes)
    {
        using var workbook = new XLWorkbook(new MemoryStream(workbookBytes));
        var worksheet = workbook.Worksheet(1);
        var preparationRow = 5 + DateTime.DaysInMonth(_start.Year, _start.Month);
        worksheet.Cell(preparationRow, 1).GetString().Should().Be("Příprava");
        return worksheet.Cell(preparationRow, 8).GetDouble(); // column H
    }
}
