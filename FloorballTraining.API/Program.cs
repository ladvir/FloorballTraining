using FloorballTraining.API.Extensions;
using FloorballTraining.API.Middlewares;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases.Trainings;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettingssecrets.json", optional: true, reloadOnChange: true);

builder.Services
    .AddPersistence(builder.Configuration, builder.Environment)
    .AddIdentityAndAuth(builder.Configuration)
    .AddUseCases()
    .AddAppServices(builder.Configuration)
    .AddCorsPolicy(builder.Configuration, builder.Environment);

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionMiddleware>();

app.UseStatusCodePagesWithReExecute("/error/{0}");

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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
