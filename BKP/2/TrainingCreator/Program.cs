using Microsoft.EntityFrameworkCore;
using TrainingCreator.Data;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Services.AcitivityServices;
using TrainingGenerator.Services.AcitivityDeletors;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();



var connectionString = builder.Configuration.GetConnectionString("Default");

builder.Services.AddDbContext<TrainingDbContext>(
    options => options.UseSqlite(connectionString, b => b.MigrationsAssembly("TrainingDataAccess"))
        .EnableSensitiveDataLogging(true)
        .LogTo(Console.WriteLine, LogLevel.Information));

if (connectionString != null)
    builder.Services.AddSingleton(new TrainingDbContextFactory(connectionString));

builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();
builder.Services.AddSingleton<IActivityService, DatabaseActivityService>();
builder.Services.AddScoped<DatabaseActivityService>();


builder.Services.AddSingleton<WeatherForecastService>();

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
