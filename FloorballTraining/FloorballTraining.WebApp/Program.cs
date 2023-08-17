using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.Plugins.InMemory;
using FloorballTraining.Services;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Equipments;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Tags;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.WebApp;
using FluentValidation;
using MudBlazor;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder(args);

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json")
    .Build();

var appSettings = new AppSettings();
configuration.GetSection("MaxTrainingDuration").Bind(appSettings);
configuration.GetSection("MaximalLengthTrainingName").Bind(appSettings);
configuration.GetSection("MaximalLengthTrainingDescription").Bind(appSettings);
configuration.GetSection("MaximalPersons").Bind(appSettings);
configuration.GetSection("MaxActivityDuration").Bind(appSettings);
configuration.GetSection("MaxTrainingPartDuration").Bind(appSettings);
configuration.GetSection("MaximalLengthTrainingPartName").Bind(appSettings);
configuration.GetSection("MaximalLengthTrainingPartDescription").Bind(appSettings);
configuration.GetSection("MinimalDurationTrainingGoalPercent").Bind(appSettings);



builder.Configuration.Bind(appSettings);

builder.Services.AddSingleton(appSettings);

//MudBlazor
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



// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();
builder.Services.AddMudServices();

//Trainings
builder.Services.AddValidatorsFromAssemblyContaining<TrainingValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<TrainingPartValidator>();
builder.Services.AddSingleton<ITrainingRepository, TrainingRepository>();
builder.Services.AddTransient<IViewTrainingByNameUseCase, ViewTrainingByNameUseCase>();
builder.Services.AddTransient<IViewTrainingByIdUseCase, ViewTrainingByIdUseCase>();
builder.Services.AddTransient<IAddTrainingUseCase, AddTrainingUseCase>();
builder.Services.AddTransient<IEditTrainingUseCase, EditTrainingUseCase>();
builder.Services.AddTransient<IViewTrainingEquipmentUseCase, ViewTrainingEquipmentUseCase>();
builder.Services.AddTransient<ICreateTrainingPdfUseCase, CreateTrainingPdfUseCase>();


//Activities
builder.Services.AddValidatorsFromAssemblyContaining<ActivityValidator>();
builder.Services.AddSingleton<IActivityRepository, ActivityRepository>();
builder.Services.AddTransient<IViewActivityByNameUseCase, ViewActivityByNameUseCase>();
builder.Services.AddTransient<IViewActivityByCriteriaUseCase, ViewActivityByCriteriaUseCase>();
builder.Services.AddTransient<IViewActivityByIdUseCase, ViewActivityByIdUseCase>();
builder.Services.AddTransient<IViewActivityNextByIdUseCase, ViewActivityNextByIdUseCase>();
builder.Services.AddTransient<IViewActivityPrevByIdUseCase, ViewActivityPrevByIdUseCase>();

builder.Services.AddTransient<IAddActivityUseCase, AddActivityUseCase>();
builder.Services.AddTransient<IEditActivityUseCase, EditActivityUseCase>();
builder.Services.AddTransient<ICloneActivityUseCase, CloneActivityUseCase>();
builder.Services.AddTransient<IDeleteActivityUseCase, DeleteActivityUseCase>();

builder.Services.AddTransient<ICreateActivityPdfUseCase, CreateActivityPdfUseCase>();



//Tags
builder.Services.AddSingleton<ITagRepository, TagRepository>();
builder.Services.AddTransient<IViewTagByNameUseCase, ViewTagByNameUseCase>();
builder.Services.AddTransient<IViewTagByIdUseCase, ViewTagByIdUseCase>();
builder.Services.AddTransient<IViewTagByParentTagIdUseCase, ViewTagByParentTagIdUseCase>();
builder.Services.AddTransient<IAddTagUseCase, AddTagUseCase>();
builder.Services.AddTransient<IEditTagUseCase, EditTagUseCase>();


//Equipments
builder.Services.AddSingleton<IEquipmentRepository, EquipmentRepository>();
builder.Services.AddTransient<IViewEquipmentByNameUseCase, ViewEquipmentByNameUseCase>();
builder.Services.AddTransient<IViewEquipmentByIdUseCase, ViewEquipmentByIdUseCase>();
builder.Services.AddTransient<IAddEquipmentUseCase, AddEquipmentUseCase>();
builder.Services.AddTransient<IEditEquipmentUseCase, EditEquipmentUseCase>();

//FileHandling
builder.Services.AddSingleton<IFileHandlingService, FileHandlingService>();

//SignalR
builder.Services.AddSignalR(o =>
{
    o.EnableDetailedErrors = true;
    o.MaximumReceiveMessageSize = long.MaxValue;
});


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
