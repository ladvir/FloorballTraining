using Microsoft.EntityFrameworkCore;
using MudBlazor;
using MudBlazor.Services;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Services.ActivityServices;
using TrainingDataAccess.Services.TagServices;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMudServices(config =>
{
    config.SnackbarConfiguration.PositionClass = Defaults.Classes.Position.TopCenter;

    config.SnackbarConfiguration.PreventDuplicates = true;
    config.SnackbarConfiguration.NewestOnTop = false;
    config.SnackbarConfiguration.ShowCloseIcon = true;
    config.SnackbarConfiguration.VisibleStateDuration = 5000;
    config.SnackbarConfiguration.HideTransitionDuration = 500;
    config.SnackbarConfiguration.ShowTransitionDuration = 500;
    config.SnackbarConfiguration.SnackbarVariant = Variant.Filled;
});

builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

var connectionString = builder.Configuration.GetConnectionString("Default");

builder.Services.AddDbContext<TrainingDbContext>(
    options => options.UseSqlite(connectionString, b => b.MigrationsAssembly("TrainingDataAccess"))
        .EnableSensitiveDataLogging(true)
        .LogTo(Console.WriteLine, LogLevel.Information));

if (connectionString != null)
    builder.Services.AddSingleton(new TrainingDbContextFactory(connectionString));

builder.Services.AddSingleton<IActivityService, DatabaseActivityService>();
builder.Services.AddScoped<DatabaseActivityService>();

builder.Services.AddSingleton<ITagService, DatabaseTagService>();
builder.Services.AddScoped<DatabaseTagService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.MapBlazorHub();
app.MapFallbackToPage("/_Host");

app.Run();