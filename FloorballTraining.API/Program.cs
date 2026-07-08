using FloorballTraining.API.Extensions;
using FloorballTraining.API.Hubs;
using FloorballTraining.API.Jobs;
using FloorballTraining.API.Middlewares;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases.Trainings;
using Hangfire;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Serilog;

// Bootstrap logger - captures startup errors before the full configuration is read.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
var builder = WebApplication.CreateBuilder(args);

// appsettingssecrets.json is a deploy-time template: production/staging substitute
// real values (SMTP_SERVER, SMTP_PASSWORD, ...) into it. In Development it holds only
// placeholders, so skip it there and let appsettings.Development.json provide real values
// (otherwise the unresolvable "SMTP_SERVER" host breaks email with "No such host is known").
if (!builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettingssecrets.json", optional: true, reloadOnChange: true);
}

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

builder.Services
    .AddPersistence(builder.Configuration, builder.Environment)
    .AddIdentityAndAuth(builder.Configuration)
    .AddUseCases()
    .AddAppServices(builder.Configuration)
    .AddCorsPolicy(builder.Configuration, builder.Environment)
    .AddAuthRateLimiting(builder.Configuration)
    .AddBackgroundJobs(builder.Configuration, builder.Environment);

// Honour X-Forwarded-For/Proto from the reverse proxy so the real client IP is
// available to audit logging and rate limiting. KnownNetworks/Proxies are cleared
// because the proxy address is not fixed in our PaaS/container deployment.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseForwardedHeaders();

// When deployed behind a path-prefixed reverse proxy (e.g. /flotr/api → API root),
// set PathBase so Hangfire and other URL generators emit the correct external paths.
// In production: Application:PathBase = /flotr/api (see appsettings.Production.json).
var pathBase = app.Configuration["Application:PathBase"];
if (!string.IsNullOrEmpty(pathBase))
{
    app.Use(async (ctx, next) =>
    {
        ctx.Request.PathBase = new PathString(pathBase);
        await next();
    });
}

app.UseMiddleware<ExceptionMiddleware>();

// Swagger/OpenAPI - exposed outside Production only (spec + UI with Bearer auth).
if (!app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "FloorballTraining API v1");
    });
}

// Structured request logging with traceId correlation.
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("TraceId", httpContext.TraceIdentifier);
        diagnosticContext.Set("UserName", httpContext.User.Identity?.Name);
    };
});

app.UseStatusCodePagesWithReExecute("/error/{0}");

app.UseHttpsRedirection();

app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseCors(FloorballTraining.API.Extensions.ServiceCollectionExtensions.CorsPolicyName);

// Rate limiting protects production; skip it in Development so local testing of the
// auth endpoints does not lock the developer out (login limit is 5/IP/15min).
if (!app.Environment.IsDevelopment())
{
    app.UseRateLimiter();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "FloTr – Background Jobs",
    Authorization = [new HangfireAuthorizationFilter()],
});

RecurringJob.AddOrUpdate<AuditLogRetentionJob>(
    "audit-log-retention",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Daily(2),
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }); // 02:00 UTC

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// SPA fallback - serve index.html for non-API routes
app.MapFallbackToFile("index.html");

// Auto-migrate database (only in Production) and seed
try
{
    using var scope = app.Services.CreateScope();

    if (!app.Environment.IsDevelopment())
    {
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        await db.Database.MigrateAsync();
    }

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

    foreach (var role in new[] { "Admin", "User" })
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    var adminEmail = "admin@flotr.cz";
    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        var admin = new AppUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FirstName = "Admin",
            LastName = "FloTr"
        };
        var result = await userManager.CreateAsync(admin, "Admin123!");
        if (result.Succeeded)
            await userManager.AddToRoleAsync(admin, "Admin");
    }

    if (app.Environment.IsDevelopment())
    {
        // Seed a plain-User account used by E2E (Playwright) tests.
        const string e2eEmail = "e2e.user@flotr.cz";
        if (await userManager.FindByEmailAsync(e2eEmail) == null)
        {
            var e2eUser = new AppUser
            {
                UserName = e2eEmail,
                Email = e2eEmail,
                FirstName = "E2E",
                LastName = "User"
            };
            var result = await userManager.CreateAsync(e2eUser, "E2eTest123!");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(e2eUser, "User");
        }
    }

    // Backfill ActivitySignature for existing trainings
    var dbCtx = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
    var trainingsToBackfill = await dbCtx.Trainings
        .Where(t => t.ActivitySignature == null)
        .Include(t => t.TrainingParts!).ThenInclude(tp => tp.TrainingGroups!)
        .ToListAsync();
    if (trainingsToBackfill.Count > 0)
    {
        foreach (var training in trainingsToBackfill)
        {
            training.ActivitySignature = TrainingSimilarity.ComputeSignature(training);
        }
        await dbCtx.SaveChangesAsync();
    }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Chyba při seedování databáze");
}

app.Run();
}
catch (Exception ex) when (ex is not Microsoft.Extensions.Hosting.HostAbortedException)
{
    Log.Fatal(ex, "Aplikace se neočekávaně ukončila při startu");
}
finally
{
    Log.CloseAndFlush();
}

// Exposed so WebApplicationFactory<Program> can bootstrap the app in integration tests.
// (Top-level statements otherwise compile Program as an internal class.)
public partial class Program { }
