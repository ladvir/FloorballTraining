using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Location is a required FK on Appointment. A missing or unknown place used to surface
/// as an unhandled DbUpdateException (FK_Appointments_Places_LocationId); the API must
/// answer 400 with a message instead.
/// </summary>
[Collection("Api")]
public class AppointmentLocationValidationTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AppointmentLocationValidationTests(CustomWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> CreateAdminClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private static object PersonalEvent(int locationId) => new
    {
        name = "Trénink bez místa",
        appointmentType = 0,
        start = "2045-01-05T18:00:00",
        end = "2045-01-05T19:00:00",
        locationId,
    };

    [Fact]
    public async Task Creating_appointment_without_location_returns_400()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/Appointments", PersonalEvent(0));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).Should().Contain("místo");
    }

    [Fact]
    public async Task Creating_appointment_with_unknown_location_returns_400()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/Appointments", PersonalEvent(99999999));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
