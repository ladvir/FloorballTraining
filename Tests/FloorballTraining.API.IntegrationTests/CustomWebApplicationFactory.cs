using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Collections.Concurrent;
using System.Net.Http;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Boots the real API against an in-memory SQLite database instead of SQL Server.
///
/// SQLite (not EF InMemory) keeps relational fidelity (constraints, transactions). A single
/// shared, open connection keeps the in-memory database alive for the whole factory lifetime;
/// the schema is created here in ConfigureServices so it exists before Program.cs runs its
/// startup seeding (admin user, roles).
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    /// <summary>
    /// Per-URL stub responses for the outbound <see cref="IHttpClientFactory"/>.
    /// Register a mapping before a test that triggers an outbound HTTP call (e.g. iCal import).
    /// The stub returns a fresh 200-OK response with the mapped string body on every hit.
    /// </summary>
    public ConcurrentDictionary<string, string> HttpStubs { get; } = new();

    public CustomWebApplicationFactory()
    {
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Development: skips the rate limiter and the production-only auto-migrate, while base
        // appsettings.json + appsettings.Development.json still supply JWT and email config.
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Drop the SQL Server DbContext/factory registrations added by AddPersistence.
            var toRemove = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<FloorballTrainingContext>) ||
                d.ServiceType == typeof(DbContextOptions) ||
                d.ServiceType == typeof(IDbContextFactory<FloorballTrainingContext>) ||
                d.ServiceType == typeof(FloorballTrainingContext) ||
                (d.ServiceType.IsGenericType &&
                 d.ServiceType.GetGenericTypeDefinition() == typeof(IDbContextFactory<>)))
                .ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContextFactory<FloorballTrainingContext>(
                (sp, options) =>
                {
                    options.UseSqlite(_connection);
                    options.AddInterceptors(sp.GetRequiredService<AuditableInterceptor>());
                },
                ServiceLifetime.Scoped);

            // Override the default IHttpClientFactory with a stub that can serve
            // pre-configured URL→body mappings. The last AddSingleton wins over
            // the TryAddSingleton from AddHttpClient(), so outbound HTTP calls
            // (e.g. ICalImportService) hit the stub instead of the real network.
            var stubs = HttpStubs;
            services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(stubs));
        });

        // Create the schema on the shared connection before Program.cs seeds at startup.
        // A directly-constructed context avoids BuildServiceProvider(), which would
        // re-initialise the (already frozen) bootstrap Serilog logger and throw.
        var options = new DbContextOptionsBuilder<FloorballTrainingContext>()
            .UseSqlite(_connection)
            .Options;
        using var context = new FloorballTrainingContext(options);
        context.Database.EnsureCreated();
    }

    /// <summary>
    /// Clears the in-process IMemoryCache so subsequent tests start with a cold cache.
    /// Call this in IAsyncLifetime.InitializeAsync for any test class that needs a cold cache.
    /// </summary>
    public void ResetCache()
    {
        var cache = Server.Services.GetRequiredService<IMemoryCache>();
        if (cache is MemoryCache mc) mc.Compact(1.0);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}

/// <summary>
/// IHttpClientFactory stub: returns a fresh 200-OK response with the registered body
/// for known URLs, or throws for unmapped ones (prevents accidental real network calls).
/// </summary>
internal sealed class StubHttpClientFactory(ConcurrentDictionary<string, string> stubs)
    : IHttpClientFactory
{
    public HttpClient CreateClient(string name = "")
        => new(new StubHandler(stubs)) { Timeout = TimeSpan.FromSeconds(5) };
}

internal sealed class StubHandler(ConcurrentDictionary<string, string> stubs) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var url = request.RequestUri?.ToString() ?? string.Empty;
        if (stubs.TryGetValue(url, out var body))
            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });

        return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.ServiceUnavailable)
        {
            Content = new StringContent(
                $"StubHttpClientFactory: no stub registered for '{url}'. " +
                "Add an entry to factory.HttpStubs before the test."),
        });
    }
}
