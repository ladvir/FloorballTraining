using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Ical.Net;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

public class ICalImportResult
{
    public int Imported { get; set; }
    public int Skipped { get; set; }
    public int Updated { get; set; }
    public List<string> Errors { get; set; } = [];
}

public interface IICalImportService
{
    Task<ICalImportResult> ImportAsync(int teamId, string ownerUserId);
    Task<ICalImportResult> ImportFromUrlAsync(string url, int teamId, string ownerUserId);
}

public class ICalImportService(
    FloorballTrainingContext context,
    IHttpClientFactory httpClientFactory) : IICalImportService
{
    public async Task<ICalImportResult> ImportAsync(int teamId, string ownerUserId)
    {
        var team = await context.Teams.FindAsync(teamId);
        if (team == null)
            return new ICalImportResult { Errors = ["Tým nebyl nalezen."] };

        if (string.IsNullOrWhiteSpace(team.ICalUrl))
            return new ICalImportResult { Errors = ["Tým nemá nastavenou URL kalendáře."] };

        return await ImportFromUrlAsync(team.ICalUrl, teamId, ownerUserId);
    }

    public async Task<ICalImportResult> ImportFromUrlAsync(string url, int teamId, string ownerUserId)
    {
        var result = new ICalImportResult();

        var team = await context.Teams.FindAsync(teamId);
        if (team == null)
        {
            result.Errors.Add("Tým nebyl nalezen.");
            return result;
        }

        // Fetch iCal data
        string icalData;
        try
        {
            var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);
            icalData = await client.GetStringAsync(url);
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Nepodařilo se stáhnout kalendář: {ex.Message}");
            return result;
        }

        // Parse iCal
        CalendarCollection? calendars;
        try
        {
            calendars = CalendarCollection.Load(icalData);
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Nepodařilo se zpracovat kalendář: {ex.Message}");
            return result;
        }

        var allEvents = calendars.SelectMany(c => c.Events).ToList();
        if (allEvents.Count == 0)
        {
            result.Errors.Add("Kalendář neobsahuje žádné události.");
            return result;
        }

        // Determine cutoff date: start of current season, or today if no season found
        var today = DateTime.Today;
        var currentSeason = await context.Set<Season>()
            .Where(s => s.StartDate <= today && s.EndDate >= today)
            .FirstOrDefaultAsync();
        var cutoffDate = currentSeason?.StartDate.Date ?? today;

        var events = allEvents
            .Where(e => (e.DtStart?.Value ?? DateTime.MinValue) >= cutoffDate)
            .ToList();

        if (events.Count == 0)
        {
            result.Errors.Add($"Kalendář neobsahuje žádné události od {cutoffDate:d.M.yyyy}.");
            return result;
        }

        // Load existing appointments for this team to detect duplicates (by UID stored in Description)
        var existingAppointments = await context.Appointments
            .Where(a => a.TeamId == teamId)
            .ToListAsync();

        // Cache of places by name
        var places = await context.Places.ToListAsync();
        var placesByName = places.ToDictionary(p => p.Name.ToLowerInvariant(), p => p);

        foreach (var evt in events)
        {
            try
            {
                var uid = evt.Uid;
                var dtStart = evt.DtStart?.Value ?? DateTime.MinValue;
                var dtEnd = evt.DtEnd?.Value ?? dtStart.AddHours(1);

                if (dtStart == DateTime.MinValue)
                {
                    result.Skipped++;
                    continue;
                }

                // Check for duplicate by matching UID stored in Description prefix
                var uidMarker = $"[ical:{uid}]";
                var existing = existingAppointments.FirstOrDefault(a =>
                    a.Description != null && a.Description.Contains(uidMarker));

                var eventName = string.IsNullOrWhiteSpace(evt.Summary) ? "Událost" : evt.Summary;
                var description = BuildDescription(evt.Description, uidMarker);
                var appointmentType = GuessAppointmentType(eventName);

                // Create place only when actually importing/updating
                var locationId = EnsureLocationId(evt.Location, placesByName);

                if (existing != null)
                {
                    existing.Name = eventName;
                    existing.Start = dtStart;
                    existing.End = dtEnd;
                    existing.LocationId = locationId;
                    existing.AppointmentType = appointmentType;
                    existing.Description = description;
                    result.Updated++;
                }
                else
                {
                    var appointment = new Appointment
                    {
                        Name = eventName,
                        Description = description,
                        Start = dtStart,
                        End = dtEnd,
                        AppointmentType = appointmentType,
                        LocationId = locationId,
                        TeamId = teamId,
                        OwnerUserId = ownerUserId,
                    };
                    context.Appointments.Add(appointment);
                    existingAppointments.Add(appointment);
                    result.Imported++;
                }
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Chyba při importu události '{evt.Summary}': {ex.Message}");
            }
        }

        await context.SaveChangesAsync();
        return result;
    }

    /// <summary>
    /// Resolves location name to an existing Place ID, or returns null if no match found.
    /// New places are tracked in pendingPlaces for deferred creation.
    /// </summary>
    private static int? ResolveExistingLocationId(string? location, Dictionary<string, Place> placesByName)
    {
        if (string.IsNullOrWhiteSpace(location))
            return null;

        var key = location.ToLowerInvariant().Trim();
        return placesByName.TryGetValue(key, out var existing) ? existing.Id : null;
    }

    /// <summary>
    /// Ensures a Place exists for the given location name. Creates it if needed.
    /// Called only when an event is actually being imported/updated.
    /// </summary>
    private int EnsureLocationId(string? location, Dictionary<string, Place> placesByName)
    {
        if (string.IsNullOrWhiteSpace(location))
            return GetOrCreateDefaultPlace(placesByName);

        var key = location.ToLowerInvariant().Trim();
        if (placesByName.TryGetValue(key, out var existing))
            return existing.Id;

        var place = new Place { Name = location.Trim() };
        context.Places.Add(place);
        context.SaveChanges();
        placesByName[key] = place;
        return place.Id;
    }

    private int GetOrCreateDefaultPlace(Dictionary<string, Place> placesByName)
    {
        const string defaultName = "neznámé";
        if (placesByName.TryGetValue(defaultName, out var existing))
            return existing.Id;

        var place = new Place { Name = "Neznámé" };
        context.Places.Add(place);
        context.SaveChanges();
        placesByName[defaultName] = place;
        return place.Id;
    }

    private static string BuildDescription(string? originalDescription, string uidMarker)
    {
        var desc = originalDescription?.Trim() ?? string.Empty;
        if (!desc.Contains(uidMarker))
        {
            desc = string.IsNullOrEmpty(desc) ? uidMarker : $"{desc}\n{uidMarker}";
        }
        return desc;
    }

    private static AppointmentType GuessAppointmentType(string name)
    {
        var lower = name.ToLowerInvariant();
        if (lower.Contains("trénink") || lower.Contains("trenink") || lower.Contains("training"))
            return AppointmentType.Training;
        if (lower.Contains("zápas") || lower.Contains("zapas") || lower.Contains("match") || lower.Contains("utkání"))
            return AppointmentType.Match;
        if (lower.Contains("soustředění") || lower.Contains("camp") || lower.Contains("kemp"))
            return AppointmentType.Camp;
        if (lower.Contains("turnaj") || lower.Contains("tournament"))
            return AppointmentType.Match;
        return AppointmentType.Other;
    }
}
