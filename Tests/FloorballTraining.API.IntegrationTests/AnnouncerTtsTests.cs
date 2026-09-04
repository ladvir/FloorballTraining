using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Announcer external-voice proxy (/announcer/tts). The Azure Speech HTTP calls are served by the
/// factory's stub IHttpClientFactory, so these run offline. Covers the no-key gates, region
/// validation, the connect → status round-trip, the voices proxy and the SSML → MP3 proxy.
/// </summary>
[Collection("Api")]
public class AnnouncerTtsTests(CustomWebApplicationFactory factory)
{
    private const string Region = "westeurope";
    private const string VoicesUrl = "https://westeurope.tts.speech.microsoft.com/cognitiveservices/voices/list";
    private const string SynthUrl = "https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1";
    private const string ValidSsml =
        "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\"cs-CZ\">" +
        "<voice name=\"cs-CZ-VlastaNeural\">Ahoj</voice></speak>";

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private async Task ClearCredentialAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        await db.AnnouncerTtsCredentials.ExecuteDeleteAsync();
    }

    [Fact]
    public async Task Status_WhenNotConfigured_ReportsFalse()
    {
        await ClearCredentialAsync();
        var client = await AdminClientAsync();
        var status = await client.GetFromJsonAsync<StatusDto>("/announcer/tts/status");
        status!.Configured.Should().BeFalse();
        status.Region.Should().BeNull();
    }

    [Fact]
    public async Task Voices_And_Speak_WithoutKey_Return409()
    {
        await ClearCredentialAsync();
        var client = await AdminClientAsync();

        (await client.GetAsync("/announcer/tts/voices")).StatusCode.Should().Be(HttpStatusCode.Conflict);
        var speak = await client.PostAsJsonAsync("/announcer/tts/speak", new { ssml = ValidSsml });
        speak.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task SaveKey_RejectsBadRegion()
    {
        var client = await AdminClientAsync();
        var resp = await client.PutAsJsonAsync("/announcer/tts/key",
            new { region = "west europe!", apiKey = "0123456789abcdef" });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Speak_RejectsNonSpeakRootSsml()
    {
        var client = await AdminClientAsync();
        var resp = await client.PostAsJsonAsync("/announcer/tts/speak", new { ssml = "<hello/>" });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Connect_Then_Status_Voices_And_Speak_Work()
    {
        await ClearCredentialAsync();
        factory.HttpStubs[VoicesUrl] =
            "[{\"ShortName\":\"cs-CZ-VlastaNeural\",\"DisplayName\":\"Vlasta\",\"LocalName\":\"Vlasta\"," +
            "\"Gender\":\"Female\",\"Locale\":\"cs-CZ\",\"LocaleName\":\"Czech\",\"StyleList\":[]," +
            "\"VoiceType\":\"Neural\",\"WordsPerMinute\":\"152\"}]";
        factory.HttpStubs[SynthUrl] = "FAKE-MP3-BYTES";

        try
        {
            var client = await AdminClientAsync();

            var connect = await client.PutAsJsonAsync("/announcer/tts/key",
                new { region = Region, apiKey = "sk-abcdef0123456789" });
            connect.StatusCode.Should().Be(HttpStatusCode.OK);
            var status = await connect.Content.ReadFromJsonAsync<StatusDto>();
            status!.Configured.Should().BeTrue();
            status.Region.Should().Be(Region);
            status.KeyLast4.Should().Be("6789");

            var voices = await client.GetFromJsonAsync<List<VoiceDto>>("/announcer/tts/voices");
            voices!.Should().ContainSingle(v => v.ShortName == "cs-CZ-VlastaNeural" && v.Gender == "Female");

            var speak = await client.PostAsJsonAsync("/announcer/tts/speak", new { ssml = ValidSsml });
            speak.StatusCode.Should().Be(HttpStatusCode.OK);
            speak.Content.Headers.ContentType!.MediaType.Should().Be("audio/mpeg");
            (await speak.Content.ReadAsByteArrayAsync()).Should().NotBeEmpty();

            (await client.DeleteAsync("/announcer/tts/key")).StatusCode.Should().Be(HttpStatusCode.NoContent);
        }
        finally
        {
            factory.HttpStubs.TryRemove(VoicesUrl, out _);
            factory.HttpStubs.TryRemove(SynthUrl, out _);
            await ClearCredentialAsync();
        }
    }

    private sealed record StatusDto(bool Configured, string? Region, string? KeyLast4);
    private sealed record VoiceDto(
        string ShortName, string DisplayName, string LocalName, string Gender,
        string Locale, string LocaleName, string[] StyleList, string? WordsPerMinute);
}
