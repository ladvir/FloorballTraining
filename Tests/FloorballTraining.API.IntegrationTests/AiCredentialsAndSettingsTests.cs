using FloorballTraining.API.Services.Ai;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// AI credentials (BYOK), consent and settings: masked keys (plaintext never leaves the
/// server), owner-only mutations, single-active switching, club-wide sharing with
/// immediate revocation, per-club enablement rules and the credential resolution
/// pipeline (own → club default → global default) with usage-time consent checks.
/// </summary>
[Collection("Api")]
public class AiCredentialsAndSettingsTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";
    private const string PlainKey = "sk-test-secret-key-abcd1234";

    private readonly string _ownerEmail = $"ai-owner-{Guid.NewGuid():N}@test.example";
    private readonly string _colleagueEmail = $"ai-colleague-{Guid.NewGuid():N}@test.example";
    private readonly string _headCoachEmail = $"ai-headcoach-{Guid.NewGuid():N}@test.example";

    private int _clubId;
    private int _otherClubId;

    public AiCredentialsAndSettingsTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"AiClub-{Guid.NewGuid():N}" };
        var otherClub = new Club { Name = $"AiOtherClub-{Guid.NewGuid():N}" };
        db.Clubs.AddRange(club, otherClub);
        await db.SaveChangesAsync();
        _clubId = club.Id;
        _otherClubId = otherClub.Id;

        async Task AddUser(string email, bool mainCoach)
        {
            var user = new AppUser
            {
                UserName = email, Email = email,
                FirstName = "Ai", LastName = "Tester",
                DefaultClubId = _clubId
            };
            (await um.CreateAsync(user, TestPassword)).Succeeded.Should().BeTrue();
            db.Members.Add(new Member
            {
                FirstName = "Ai", LastName = "Tester", Email = email, BirthYear = 1990,
                ClubId = _clubId, AppUserId = user.Id,
                HasClubRoleCoach = !mainCoach, HasClubRoleMainCoach = mainCoach
            });
            await db.SaveChangesAsync();
        }

        await AddUser(_ownerEmail, mainCoach: false);
        await AddUser(_colleagueEmail, mainCoach: false);
        await AddUser(_headCoachEmail, mainCoach: true);
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<HttpClient> ClientFor(string email)
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private async Task<HttpClient> AdminClient()
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private static Task<HttpResponseMessage> CreateCredential(
        HttpClient client, string name, string key = PlainKey, AiProvider provider = AiProvider.Anthropic) =>
        client.PostAsJsonAsync("/aicredentials",
            new CreateAiCredentialRequest { Name = name, Provider = provider, ApiKey = key });

    private async Task SetGlobalSettings(bool enabled, int? defaultCredentialId = null)
    {
        var admin = await AdminClient();
        var response = await admin.PutAsJsonAsync("/aisettings/global",
            new UpdateAiSettingsRequest { Enabled = enabled, DefaultCredentialId = defaultCredentialId });
        response.EnsureSuccessStatusCode();
    }

    private async Task SetClubSettings(int clubId, bool enabled, int? defaultCredentialId = null)
    {
        var admin = await AdminClient();
        var response = await admin.PutAsJsonAsync($"/aisettings/club/{clubId}",
            new UpdateAiSettingsRequest { Enabled = enabled, DefaultCredentialId = defaultCredentialId });
        response.EnsureSuccessStatusCode();
    }

    // ── Credentials CRUD ─────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ReturnsMaskedKey_PlaintextNeverInResponse()
    {
        var owner = await ClientFor(_ownerEmail);

        var response = await CreateCredential(owner, "Můj Claude");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var raw = await response.Content.ReadAsStringAsync();
        raw.Should().NotContain(PlainKey);

        var dto = System.Text.Json.JsonSerializer.Deserialize<AiCredentialDto>(raw,
            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        dto.KeyLast4.Should().Be("1234");
        dto.IsActive.Should().BeTrue("first credential becomes active automatically");
        dto.NeedsReentry.Should().BeFalse();

        // Encrypted at rest: the DB row must not contain the plaintext key.
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var entity = await db.UserAiCredentials.SingleAsync(c => c.Id == dto.Id);
        entity.EncryptedApiKey.Should().NotContain(PlainKey);

        var listRaw = await owner.GetStringAsync("/aicredentials");
        listRaw.Should().NotContain(PlainKey);
    }

    [Fact]
    public async Task List_ReturnsOnlyOwnCredentials()
    {
        var owner = await ClientFor(_ownerEmail);
        var colleague = await ClientFor(_colleagueEmail);

        (await CreateCredential(owner, "Owner list key")).EnsureSuccessStatusCode();
        (await CreateCredential(colleague, "Colleague list key")).EnsureSuccessStatusCode();

        var ownerList = await owner.GetFromJsonAsync<List<AiCredentialDto>>("/aicredentials");
        ownerList!.Should().Contain(c => c.Name == "Owner list key")
            .And.NotContain(c => c.Name == "Colleague list key");
    }

    [Fact]
    public async Task Activate_SwitchesTheSingleActiveCredential()
    {
        var owner = await ClientFor(_ownerEmail);
        var first = (await (await CreateCredential(owner, $"A-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;
        var second = (await (await CreateCredential(owner, $"B-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;
        second.IsActive.Should().BeFalse("an active credential already exists");

        var response = await owner.PostAsync($"/aicredentials/{second.Id}/activate", null);
        response.EnsureSuccessStatusCode();

        var list = await owner.GetFromJsonAsync<List<AiCredentialDto>>("/aicredentials");
        list!.Single(c => c.Id == second.Id).IsActive.Should().BeTrue();
        list.Where(c => c.Id != second.Id).Should().OnlyContain(c => !c.IsActive);
    }

    [Fact]
    public async Task Update_RotatesKeyAndResetsValidation()
    {
        var owner = await ClientFor(_ownerEmail);
        var created = (await (await CreateCredential(owner, $"Rot-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;

        var response = await owner.PutAsJsonAsync($"/aicredentials/{created.Id}",
            new UpdateAiCredentialRequest { Name = created.Name, ApiKey = "sk-rotated-key-xyz9999" });
        response.EnsureSuccessStatusCode();

        var updated = await response.Content.ReadFromJsonAsync<AiCredentialDto>();
        updated!.KeyLast4.Should().Be("9999");
        updated.LastValidatedAt.Should().BeNull();
    }

    [Fact]
    public async Task ForeignCredential_MutationsReturnNotFound()
    {
        var owner = await ClientFor(_ownerEmail);
        var colleague = await ClientFor(_colleagueEmail);
        var created = (await (await CreateCredential(owner, $"Foreign-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;

        (await colleague.PutAsJsonAsync($"/aicredentials/{created.Id}",
                new UpdateAiCredentialRequest { Name = "hijack" }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await colleague.DeleteAsync($"/aicredentials/{created.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await colleague.PostAsync($"/aicredentials/{created.Id}/activate", null))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await colleague.PostAsJsonAsync($"/aicredentials/{created.Id}/share",
                new ShareAiCredentialRequest { ClubId = _clubId }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Sharing / consent ────────────────────────────────────────────────────

    [Fact]
    public async Task Share_ToOwnClub_ThenRevoke()
    {
        var owner = await ClientFor(_ownerEmail);
        var created = (await (await CreateCredential(owner, $"Share-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;

        var share = await owner.PostAsJsonAsync($"/aicredentials/{created.Id}/share",
            new ShareAiCredentialRequest { ClubId = _clubId });
        share.EnsureSuccessStatusCode();
        var consent = await share.Content.ReadFromJsonAsync<AiConsentDto>();
        consent!.ClubId.Should().Be(_clubId);

        // Duplicate share → conflict
        (await owner.PostAsJsonAsync($"/aicredentials/{created.Id}/share",
                new ShareAiCredentialRequest { ClubId = _clubId }))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);

        // Sharing to a club the owner is not a member of → forbidden
        (await owner.PostAsJsonAsync($"/aicredentials/{created.Id}/share",
                new ShareAiCredentialRequest { ClubId = _otherClubId }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        (await owner.DeleteAsync($"/aicredentials/{created.Id}/share/{consent.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── Settings authorization ───────────────────────────────────────────────

    [Fact]
    public async Task GlobalSettings_AdminOnly()
    {
        var owner = await ClientFor(_ownerEmail);
        (await owner.GetAsync("/aisettings/global")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await owner.PutAsJsonAsync("/aisettings/global", new UpdateAiSettingsRequest { Enabled = true }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClubSettings_EnabledToggleIsAdminOnly_DefaultPickIsHeadCoach()
    {
        // Admin enables the club; head coach may then pick a club-consented default.
        await SetClubSettings(_clubId, enabled: true);

        var owner = await ClientFor(_ownerEmail);
        var created = (await (await CreateCredential(owner, $"ClubDef-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;
        (await owner.PostAsJsonAsync($"/aicredentials/{created.Id}/share",
            new ShareAiCredentialRequest { ClubId = _clubId })).EnsureSuccessStatusCode();

        var headCoach = await ClientFor(_headCoachEmail);

        // Head coach flipping Enabled → forbidden
        (await headCoach.PutAsJsonAsync($"/aisettings/club/{_clubId}",
                new UpdateAiSettingsRequest { Enabled = false }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Head coach picking a club-consented default → ok
        var pick = await headCoach.PutAsJsonAsync($"/aisettings/club/{_clubId}",
            new UpdateAiSettingsRequest { Enabled = true, DefaultCredentialId = created.Id });
        pick.EnsureSuccessStatusCode();
        var dto = await pick.Content.ReadFromJsonAsync<AiSettingsDto>();
        dto!.DefaultCredentialId.Should().Be(created.Id);
        dto.DefaultValid.Should().BeTrue();

        // Picking a credential without club consent → bad request
        var unshared = (await (await CreateCredential(owner, $"Unshared-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;
        (await headCoach.PutAsJsonAsync($"/aisettings/club/{_clubId}",
                new UpdateAiSettingsRequest { Enabled = true, DefaultCredentialId = unshared.Id }))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Eligible list contains only club-consented credentials
        var eligible = await headCoach.GetFromJsonAsync<List<EligibleCredentialDto>>(
            $"/aisettings/club/{_clubId}/credentials");
        eligible!.Should().Contain(c => c.Id == created.Id)
            .And.NotContain(c => c.Id == unshared.Id);

        // Outsider (coach) cannot read another club's settings
        var colleague = await ClientFor(_colleagueEmail);
        (await colleague.GetAsync($"/aisettings/club/{_otherClubId}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── Resolution pipeline (status endpoint + resolver) ─────────────────────

    [Fact]
    public async Task Status_DisabledGloballyOrPerClub_ReportsDisabled()
    {
        await SetGlobalSettings(enabled: false);
        await SetClubSettings(_clubId, enabled: true);

        var owner = await ClientFor(_ownerEmail);
        var status = await owner.GetFromJsonAsync<AiStatusDto>($"/aisettings/status?clubId={_clubId}");
        status!.Enabled.Should().BeFalse("global kill-switch wins");

        await SetGlobalSettings(enabled: true);
        await SetClubSettings(_clubId, enabled: false);
        status = await owner.GetFromJsonAsync<AiStatusDto>($"/aisettings/status?clubId={_clubId}");
        status!.Enabled.Should().BeFalse("club must be enabled too");
    }

    [Fact]
    public async Task ResolutionOrder_OwnBeatsClubDefault_RevokeFallsThrough()
    {
        // Arrange: enabled globally + for club; club default = owner's shared credential;
        // global default = admin's own credential.
        var admin = await AdminClient();
        var adminCredential = (await (await CreateCredential(admin, $"AdminGlobal-{Guid.NewGuid():N}",
            "sk-admin-key-0000")).Content.ReadFromJsonAsync<AiCredentialDto>())!;
        await SetGlobalSettings(enabled: true, defaultCredentialId: adminCredential.Id);

        var owner = await ClientFor(_ownerEmail);
        var ownerCredential = (await (await CreateCredential(owner, $"OwnerShared-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;
        var share = await owner.PostAsJsonAsync($"/aicredentials/{ownerCredential.Id}/share",
            new ShareAiCredentialRequest { ClubId = _clubId });
        share.EnsureSuccessStatusCode();
        var consent = (await share.Content.ReadFromJsonAsync<AiConsentDto>())!;
        await SetClubSettings(_clubId, enabled: true, defaultCredentialId: ownerCredential.Id);

        // Owner has an own active credential → resolves to Own
        var ownerStatus = await owner.GetFromJsonAsync<AiStatusDto>($"/aisettings/status?clubId={_clubId}");
        ownerStatus!.Enabled.Should().BeTrue();
        ownerStatus.Source.Should().Be(AiCredentialSource.Own);

        // Colleague without own credential → club default
        var colleagueNoKeyEmail = $"ai-nokey-{Guid.NewGuid():N}@test.example";
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var user = new AppUser
            {
                UserName = colleagueNoKeyEmail, Email = colleagueNoKeyEmail,
                FirstName = "No", LastName = "Key", DefaultClubId = _clubId
            };
            (await um.CreateAsync(user, TestPassword)).Succeeded.Should().BeTrue();
            db.Members.Add(new Member
            {
                FirstName = "No", LastName = "Key", Email = colleagueNoKeyEmail, BirthYear = 1995,
                ClubId = _clubId, AppUserId = user.Id, HasClubRoleCoach = true
            });
            await db.SaveChangesAsync();
        }
        var noKey = await ClientFor(colleagueNoKeyEmail);
        var noKeyStatus = await noKey.GetFromJsonAsync<AiStatusDto>($"/aisettings/status?clubId={_clubId}");
        noKeyStatus!.Source.Should().Be(AiCredentialSource.ClubDefault);

        // Usage-time consent check: revoking the club consent immediately drops the
        // club default; resolution falls through to the global default.
        (await owner.DeleteAsync($"/aicredentials/{ownerCredential.Id}/share/{consent.Id}"))
            .EnsureSuccessStatusCode();
        noKeyStatus = await noKey.GetFromJsonAsync<AiStatusDto>($"/aisettings/status?clubId={_clubId}");
        noKeyStatus!.Source.Should().Be(AiCredentialSource.GlobalDefault);

        // Resolver (the component actually used by AI calls) agrees.
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var resolver = scope.ServiceProvider.GetRequiredService<IAiCredentialResolver>();
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var noKeyUserId = (await db.Users.SingleAsync(u => u.Email == colleagueNoKeyEmail)).Id;

            var resolved = await resolver.ResolveAsync(noKeyUserId, _clubId);
            resolved.Error.Should().BeNull();
            resolved.Credential!.Source.Should().Be(AiCredentialSource.GlobalDefault);
            resolved.Credential.ApiKey.Should().Be("sk-admin-key-0000", "resolver decrypts the stored key");

            // Removing the global consent as well → no credential left.
            var globalConsent = await db.AiCredentialConsents
                .SingleAsync(s => s.CredentialId == adminCredential.Id && s.Scope == AiConsentScope.Global);
            db.AiCredentialConsents.Remove(globalConsent);
            await db.SaveChangesAsync();

            resolved = await resolver.ResolveAsync(noKeyUserId, _clubId);
            resolved.Error.Should().Be(AiResolutionError.NoCredential);
        }
    }

    [Fact]
    public async Task Resolver_UndecryptableOwnKey_FailsWithDecryptFailed()
    {
        await SetGlobalSettings(enabled: true);
        await SetClubSettings(_clubId, enabled: true);

        var owner = await ClientFor(_ownerEmail);
        var created = (await (await CreateCredential(owner, $"Broken-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;
        (await owner.PostAsync($"/aicredentials/{created.Id}/activate", null)).EnsureSuccessStatusCode();

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var entity = await db.UserAiCredentials.SingleAsync(c => c.Id == created.Id);
        entity.EncryptedApiKey = "not-a-valid-protected-payload";
        await db.SaveChangesAsync();

        var resolver = scope.ServiceProvider.GetRequiredService<IAiCredentialResolver>();
        var ownerId = (await db.Users.SingleAsync(u => u.Email == _ownerEmail)).Id;
        var resolved = await resolver.ResolveAsync(ownerId, _clubId);
        resolved.Error.Should().Be(AiResolutionError.DecryptFailed);

        // Surfaced to the owner as needsReentry, not a 500.
        var list = await owner.GetFromJsonAsync<List<AiCredentialDto>>("/aicredentials");
        list!.Single(c => c.Id == created.Id).NeedsReentry.Should().BeTrue();
    }

    // ── Key validation ───────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_RawAndStoredKey_UsesProviderModelsEndpoint()
    {
        _factory.HttpStubs["https://api.anthropic.com/v1/models"] = "{\"data\":[]}";

        var owner = await ClientFor(_ownerEmail);

        var raw = await owner.PostAsJsonAsync("/aicredentials/validate",
            new ValidateAiKeyRequest { Provider = AiProvider.Anthropic, ApiKey = "sk-check" });
        raw.EnsureSuccessStatusCode();
        (await raw.Content.ReadFromJsonAsync<AiKeyCheckResultDto>())!.Ok.Should().BeTrue();

        var created = (await (await CreateCredential(owner, $"Val-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;
        var stored = await owner.PostAsync($"/aicredentials/{created.Id}/validate", null);
        stored.EnsureSuccessStatusCode();
        (await stored.Content.ReadFromJsonAsync<AiKeyCheckResultDto>())!.Ok.Should().BeTrue();

        var list = await owner.GetFromJsonAsync<List<AiCredentialDto>>("/aicredentials");
        list!.Single(c => c.Id == created.Id).LastValidatedAt.Should().NotBeNull();

        // Unstubbed provider → stub returns 503 → graceful failure, not an exception.
        var gemini = await owner.PostAsJsonAsync("/aicredentials/validate",
            new ValidateAiKeyRequest { Provider = AiProvider.Gemini, ApiKey = "bad" });
        gemini.EnsureSuccessStatusCode();
        (await gemini.Content.ReadFromJsonAsync<AiKeyCheckResultDto>())!.Ok.Should().BeFalse();
    }

    // ── Audit ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CredentialLifecycle_WritesAuditRows()
    {
        var owner = await ClientFor(_ownerEmail);
        var created = (await (await CreateCredential(owner, $"Audit-{Guid.NewGuid():N}")).Content
            .ReadFromJsonAsync<AiCredentialDto>())!;
        var share = await owner.PostAsJsonAsync($"/aicredentials/{created.Id}/share",
            new ShareAiCredentialRequest { ClubId = _clubId });
        share.EnsureSuccessStatusCode();

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var entityId = created.Id.ToString();

        (await db.AuditLogs.AnyAsync(a => a.Action == "AiCredential.Created" && a.EntityId == entityId))
            .Should().BeTrue();
        (await db.AuditLogs.AnyAsync(a => a.Action == "AiConsent.Granted")).Should().BeTrue();
    }
}
