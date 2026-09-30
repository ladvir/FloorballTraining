using System.Security.Claims;
using ClosedXML.Excel;
using FloorballTraining.API.Controllers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// EOS attendance import: analyze must auto-match an existing appointment by team+type+start and
/// the roster by name, and commit must upsert AppointmentAttendance without touching unrelated
/// members' records. Drives the real TeamsController like AppointmentExportHoursSourceTests does.
/// </summary>
[Collection("Api")]
public class TeamsControllerAttendanceImportTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private int _teamId;
    private int _appointmentId;
    private int _memberId1;
    private int _memberId2;
    private string _headCoachUserId = "";

    public async Task InitializeAsync()
    {
        var headCoachUserId = Guid.NewGuid().ToString();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"AttImportClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();

        var team = new Team { Name = $"AttImportTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        db.Users.Add(new AppUser { Id = headCoachUserId, UserName = $"u-{headCoachUserId}", Email = $"{headCoachUserId}@t.cz", FirstName = "Head", LastName = "Coach" });
        var coachMember = new Member { FirstName = "Head", LastName = "Coach", BirthYear = 1985, ClubId = club.Id, AppUserId = headCoachUserId, HasClubRoleMainCoach = true };
        db.Members.Add(coachMember);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = team.Id, MemberId = coachMember.Id, IsCoach = true });

        var m1 = new Member { FirstName = "Jan", LastName = "Novák", BirthYear = 2010, ClubId = club.Id };
        var m2 = new Member { FirstName = "Petr", LastName = "Svoboda", BirthYear = 2011, ClubId = club.Id };
        db.Members.AddRange(m1, m2);
        await db.SaveChangesAsync();
        db.TeamMembers.AddRange(
            new TeamMember { TeamId = team.Id, MemberId = m1.Id, IsPlayer = true },
            new TeamMember { TeamId = team.Id, MemberId = m2.Id, IsPlayer = true });

        var appointment = new Appointment
        {
            AppointmentType = AppointmentType.Training,
            Start = new DateTime(2026, 3, 10, 18, 0, 0),
            End = new DateTime(2026, 3, 10, 19, 0, 0),
            LocationId = 1,
            TeamId = team.Id,
        };
        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();

        _teamId = team.Id;
        _appointmentId = appointment.Id;
        _memberId1 = m1.Id;
        _memberId2 = m2.Id;
        _headCoachUserId = headCoachUserId;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private TeamsController Controller(IServiceProvider sp)
    {
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, _headCoachUserId)], "TestAuth"));
        var controller = ActivatorUtilities.CreateInstance<TeamsController>(sp);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } };
        return controller;
    }

    // Mirrors the real EOS export's exact column layout (header row + the 6 columns the
    // controller actually reads: B/C/G/I/J/K). K must be a literal string cell, not a
    // ClosedXML DateTime value — the controller parses it with DateTime.TryParseExact.
    private static IFormFile BuildAttendanceXlsx(params (string Name, string Birth, string Attended, string Start)[] rows)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("docházka běžných členů");
        string[] headers =
        [
            "ID", "Člen", "Datum narození", "Věk", "Deaktivován", "Definice účasti",
            "Účast", "Účast (délka)", "Typ události", "Název události", "Začátek", "Konec", "Délka (h)", "Týmy"
        ];
        for (var c = 0; c < headers.Length; c++) ws.Cell(1, c + 1).Value = headers[c];

        var r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 2).Value = row.Name;
            ws.Cell(r, 3).Value = row.Birth;
            ws.Cell(r, 7).Value = row.Attended;
            ws.Cell(r, 9).Value = "Trénink";
            ws.Cell(r, 10).Value = "Úterní trénink";
            ws.Cell(r, 11).Value = row.Start;
            r++;
        }

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        var bytes = ms.ToArray();
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", "attendance.xlsx")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
    }

    [Fact]
    public async Task Analyze_matches_appointment_by_team_type_and_start_and_members_by_roster_name()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var file = BuildAttendanceXlsx(
            ("Novák Jan", "2010-05-01", "ano", "2026-03-10 18:00"),
            ("Svoboda Petr", "2011-02-15", "ne", "2026-03-10 18:00"));

        var actionResult = await Controller(scope.ServiceProvider).ImportAttendanceAnalyze(_teamId, file);

        var analyzed = actionResult.Should().BeOfType<OkObjectResult>().Subject.Value
            .Should().BeOfType<AttendanceImportAnalyzeResultDto>().Subject;
        analyzed.ParseErrors.Should().BeEmpty();

        var ev = analyzed.Events.Should().ContainSingle().Subject;
        ev.MatchedAppointmentId.Should().Be(_appointmentId);
        ev.CandidateAppointments.Should().BeEmpty();
        ev.Members.Should().HaveCount(2);
        ev.Members.Should().ContainSingle(m => m.MatchedMemberId == _memberId1 && m.Attended && m.Existing == null);
        ev.Members.Should().ContainSingle(m => m.MatchedMemberId == _memberId2 && !m.Attended && m.Existing == null);
    }

    [Fact]
    public async Task Commit_leaves_conflicting_attendance_untouched_when_event_level_update_flag_is_off()
    {
        await using (var seedScope = factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            // Pre-existing record for member 1 — commit must surface this as a conflict and
            // only overwrite it when the caller opts in via the per-event flag.
            db.AppointmentAttendances.Add(new AppointmentAttendance
            {
                AppointmentId = _appointmentId,
                MemberId = _memberId1,
                Status = 2, // previously recorded absent
                RecordedByUserId = _headCoachUserId,
            });
            await db.SaveChangesAsync();
        }

        await using var scope = factory.Services.CreateAsyncScope();
        var request = new AttendanceImportCommitRequestDto
        {
            Events =
            [
                new AttendanceImportEventCommitDto
                {
                    AppointmentId = _appointmentId,
                    UpdateAllExistingAttendance = false,
                    Members =
                    [
                        new AttendanceImportMemberCommitDto
                        {
                            NameRaw = "Novák Jan",
                            Attended = true,
                            Action = AttendanceImportMemberAction.UseExisting,
                            MemberId = _memberId1,
                        },
                        new AttendanceImportMemberCommitDto
                        {
                            NameRaw = "Svoboda Petr",
                            Attended = false,
                            Action = AttendanceImportMemberAction.UseExisting,
                            MemberId = _memberId2,
                        },
                    ],
                },
            ],
        };

        var actionResult = await Controller(scope.ServiceProvider).ImportAttendanceCommit(_teamId, request);

        var committed = actionResult.Should().BeOfType<OkObjectResult>().Subject.Value
            .Should().BeOfType<AttendanceImportCommitResultDto>().Subject;
        committed.EventsMatched.Should().Be(1);
        committed.AttendanceCreated.Should().Be(1);
        committed.AttendanceSkippedConflict.Should().Be(1);
        committed.AttendanceUpdated.Should().Be(0);

        var db2 = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db2.AppointmentAttendances.CountAsync(a => a.AppointmentId == _appointmentId)).Should().Be(2);
        (await db2.AppointmentAttendances.SingleAsync(a => a.AppointmentId == _appointmentId && a.MemberId == _memberId1))
            .Status.Should().Be(2); // untouched — conflict was skipped
        (await db2.AppointmentAttendances.SingleAsync(a => a.AppointmentId == _appointmentId && a.MemberId == _memberId2))
            .Status.Should().Be(2); // newly created, Absent
    }

    [Fact]
    public async Task Commit_updates_every_conflicting_member_when_event_level_update_flag_is_on()
    {
        await using (var seedScope = factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            // Both members already have a (stale) record — the single event-level toggle must
            // update BOTH without asking per member.
            db.AppointmentAttendances.AddRange(
                new AppointmentAttendance { AppointmentId = _appointmentId, MemberId = _memberId1, Status = 2, RecordedByUserId = _headCoachUserId },
                new AppointmentAttendance { AppointmentId = _appointmentId, MemberId = _memberId2, Status = 2, RecordedByUserId = _headCoachUserId });
            await db.SaveChangesAsync();
        }

        await using var scope = factory.Services.CreateAsyncScope();
        var request = new AttendanceImportCommitRequestDto
        {
            Events =
            [
                new AttendanceImportEventCommitDto
                {
                    AppointmentId = _appointmentId,
                    UpdateAllExistingAttendance = true,
                    Members =
                    [
                        new AttendanceImportMemberCommitDto { NameRaw = "Novák Jan", Attended = true, Action = AttendanceImportMemberAction.UseExisting, MemberId = _memberId1 },
                        new AttendanceImportMemberCommitDto { NameRaw = "Svoboda Petr", Attended = true, Action = AttendanceImportMemberAction.UseExisting, MemberId = _memberId2 },
                    ],
                },
            ],
        };

        var actionResult = await Controller(scope.ServiceProvider).ImportAttendanceCommit(_teamId, request);

        var committed = actionResult.Should().BeOfType<OkObjectResult>().Subject.Value
            .Should().BeOfType<AttendanceImportCommitResultDto>().Subject;
        committed.AttendanceUpdated.Should().Be(2);
        committed.AttendanceSkippedConflict.Should().Be(0);

        var db2 = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db2.AppointmentAttendances.Where(a => a.AppointmentId == _appointmentId).Select(a => a.Status).ToListAsync())
            .Should().OnlyContain(s => s == 1);
    }

    [Fact]
    public async Task Commit_creates_a_new_appointment_from_import_data_when_requested()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var newStart = new DateTime(2026, 4, 1, 17, 30, 0);
        var request = new AttendanceImportCommitRequestDto
        {
            Events =
            [
                new AttendanceImportEventCommitDto
                {
                    CreateNewAppointment = true,
                    EventTypeRaw = "Trénink",
                    EventName = "Středeční trénink",
                    Start = newStart,
                    End = newStart.AddHours(1.5),
                    Members =
                    [
                        new AttendanceImportMemberCommitDto { NameRaw = "Novák Jan", Attended = true, Action = AttendanceImportMemberAction.UseExisting, MemberId = _memberId1 },
                    ],
                },
            ],
        };

        var actionResult = await Controller(scope.ServiceProvider).ImportAttendanceCommit(_teamId, request);

        var committed = actionResult.Should().BeOfType<OkObjectResult>().Subject.Value
            .Should().BeOfType<AttendanceImportCommitResultDto>().Subject;
        committed.AppointmentsCreated.Should().Be(1);
        committed.AttendanceCreated.Should().Be(1);

        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var created = await db.Appointments.SingleAsync(a => a.TeamId == _teamId && a.Start == newStart);
        created.Name.Should().Be("Středeční trénink");
        created.AppointmentType.Should().Be(AppointmentType.Training);
        (await db.AppointmentAttendances.AnyAsync(a => a.AppointmentId == created.Id && a.MemberId == _memberId1)).Should().BeTrue();
    }

    [Fact]
    public async Task Commit_syncs_a_manually_picked_appointment_from_import_data()
    {
        // A second same-day appointment the coach manually pairs the import to, instead of the
        // auto-matched one — its Name/Start/Type must be overwritten from the Excel event.
        int otherAppointmentId;
        await using (var seedScope = factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var other = new Appointment
            {
                AppointmentType = AppointmentType.Other,
                Name = "Stará neupřesněná událost",
                Start = new DateTime(2026, 3, 10, 18, 30, 0),
                End = new DateTime(2026, 3, 10, 19, 30, 0),
                LocationId = 1,
                TeamId = _teamId,
            };
            db.Appointments.Add(other);
            await db.SaveChangesAsync();
            otherAppointmentId = other.Id;
        }

        await using var scope = factory.Services.CreateAsyncScope();
        var importedStart = new DateTime(2026, 3, 10, 18, 0, 0);
        var request = new AttendanceImportCommitRequestDto
        {
            Events =
            [
                new AttendanceImportEventCommitDto
                {
                    AppointmentId = otherAppointmentId,
                    SyncAppointmentFromImport = true,
                    EventTypeRaw = "Trénink",
                    EventName = "Úterní trénink",
                    Start = importedStart,
                    End = importedStart.AddHours(2),
                    Members =
                    [
                        new AttendanceImportMemberCommitDto { NameRaw = "Novák Jan", Attended = true, Action = AttendanceImportMemberAction.UseExisting, MemberId = _memberId1 },
                    ],
                },
            ],
        };

        var actionResult = await Controller(scope.ServiceProvider).ImportAttendanceCommit(_teamId, request);

        var committed = actionResult.Should().BeOfType<OkObjectResult>().Subject.Value
            .Should().BeOfType<AttendanceImportCommitResultDto>().Subject;
        committed.AppointmentsSynced.Should().Be(1);

        var db2 = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var synced = await db2.Appointments.SingleAsync(a => a.Id == otherAppointmentId);
        synced.Name.Should().Be("Úterní trénink");
        synced.Start.Should().Be(importedStart);
        synced.AppointmentType.Should().Be(AppointmentType.Training);
    }

    [Fact]
    public async Task Commit_creating_a_new_member_enrolls_them_on_the_team()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var request = new AttendanceImportCommitRequestDto
        {
            Events =
            [
                new AttendanceImportEventCommitDto
                {
                    AppointmentId = _appointmentId,
                    Members =
                    [
                        new AttendanceImportMemberCommitDto
                        {
                            NameRaw = "Dvořák Filip",
                            Attended = true,
                            Action = AttendanceImportMemberAction.CreateNew,
                            NewFirstName = "Filip",
                            NewLastName = "Dvořák",
                        },
                    ],
                },
            ],
        };

        var actionResult = await Controller(scope.ServiceProvider).ImportAttendanceCommit(_teamId, request);

        var committed = actionResult.Should().BeOfType<OkObjectResult>().Subject.Value
            .Should().BeOfType<AttendanceImportCommitResultDto>().Subject;
        committed.MembersCreated.Should().Be(1);
        committed.MembersAddedToTeam.Should().Be(1);
        committed.AttendanceCreated.Should().Be(1);

        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var newMember = await db.Members.SingleAsync(m => m.FirstName == "Filip" && m.LastName == "Dvořák");
        (await db.TeamMembers.AnyAsync(tm => tm.TeamId == _teamId && tm.MemberId == newMember.Id)).Should().BeTrue();
        (await db.AppointmentAttendances.SingleAsync(a => a.AppointmentId == _appointmentId && a.MemberId == newMember.Id))
            .Status.Should().Be(1);
    }
}
