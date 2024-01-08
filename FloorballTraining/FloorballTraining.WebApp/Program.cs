using System.Text.Json.Serialization;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Factories;
using FloorballTraining.Services;
using FloorballTraining.Services.EmailService;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.AgeGroups;
using FloorballTraining.UseCases.Equipments;
using FloorballTraining.UseCases.Places;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Tags;
using FloorballTraining.UseCases.Trainings;
using FluentValidation;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
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
configuration.GetSection("MaximalLengthTrainingGroupName").Bind(appSettings);
configuration.GetSection("MinimalDurationTrainingGoalPercent").Bind(appSettings);
configuration.GetSection("AssetsPath").Bind(appSettings);

builder.Services.AddDbContextFactory<FloorballTrainingContext>(options =>
{
    options

        .UseSqlServer(builder.Configuration.GetConnectionString("FloorballTraining"),
            opt => opt.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery).UseRelationalNulls())
        // .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
        .EnableSensitiveDataLogging();
}, ServiceLifetime.Scoped);

builder.Configuration.AddJsonFile("appsettingssecrets.json", optional: true, reloadOnChange: true);

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

//Repositories
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericEFCoreRepository<>));
builder.Services.AddScoped<IActivityRepository, ActivityEfCoreRepository>();
builder.Services.AddScoped<ITagRepository, TagEFCoreRepository>();
builder.Services.AddScoped<IEquipmentRepository, EquipmentEFCoreRepository>();
builder.Services.AddScoped<ITrainingRepository, TrainingEFCoreRepository>();
builder.Services.AddScoped<IAgeGroupRepository, AgeGroupEFCoreRepository>();
builder.Services.AddScoped<IPlaceRepository, PlaceEFCoreRepository>();
builder.Services.AddScoped<ITrainingPartRepository, TrainingPartEFCoreRepository>();
builder.Services.AddScoped<ITrainingGroupRepository, TrainingGroupEFCoreRepository>();
builder.Services.AddScoped<IActivityTagRepository, ActivityTagEFCoreRepository>();
builder.Services.AddScoped<IActivityEquipmentRepository, ActivityEquipmentEFCoreRepository>();
builder.Services.AddScoped<IActivityMediaRepository, ActivityMediaEFCoreRepository>();



//factories
builder.Services.AddScoped<IEquipmentFactory, EquipmentEFCoreFactory>();
builder.Services.AddScoped<IPlaceFactory, PlaceEFCoreFactory>();
builder.Services.AddScoped<IAgeGroupFactory, AgeGroupEFCoreFactory>();
builder.Services.AddScoped<ITagFactory, TagEFCoreFactory>();
builder.Services.AddScoped<IActivityFactory, ActivityEFCoreFactory>();
builder.Services.AddScoped<IActivityTagFactory, ActivityTagEFCoreFactory>();
builder.Services.AddScoped<IActivityEquipmentFactory, ActivityEquipmentEFCoreFactory>();
builder.Services.AddScoped<IActivityMediaFactory, ActivityMediaEFCoreFactory>();

builder.Services.AddScoped<ITrainingFactory, TrainingEFCoreFactory>();
builder.Services.AddScoped<ITrainingPartFactory, TrainingPartEFCoreFactory>();
builder.Services.AddScoped<ITrainingGroupFactory, TrainingGroupEFCoreFactory>();

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();
builder.Services.AddMudServices();

//Trainings
builder.Services.AddValidatorsFromAssemblyContaining<TrainingValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<TrainingPartValidator>();

builder.Services.AddTransient<IViewTrainingsAllUseCase, ViewTrainingsAllUseCase>();
builder.Services.AddTransient<IViewTrainingsUseCase, ViewTrainingsUseCase>();
builder.Services.AddTransient<IViewTrainingByIdUseCase, ViewTrainingByIdUseCase>();
builder.Services.AddTransient<IAddTrainingUseCase, AddTrainingUseCase>();
builder.Services.AddTransient<IEditTrainingUseCase, EditTrainingUseCase>();
builder.Services.AddTransient<IViewTrainingEquipmentUseCase, ViewTrainingEquipmentUseCase>();
builder.Services.AddTransient<ICreateTrainingPdfUseCase, CreateTrainingPdfUseCase>();
builder.Services.AddTransient<ISendTrainingViaEmailUseCase, SendTrainingViaEmailUseCase>();

//Activities
builder.Services.AddValidatorsFromAssemblyContaining<ActivityValidator>();

builder.Services.AddTransient<IViewActivitiesUseCase, ViewActivitiesUseCase>();
builder.Services.AddTransient<IViewActivityByIdUseCase, ViewActivityByIdUseCase>();

builder.Services.AddTransient<IViewActivitiesBaseUseCase, ViewActivitiesBaseUseCase>();
builder.Services.AddTransient<IViewActivityBaseByIdUseCase, ViewActivityBaseByIdUseCase>();

builder.Services.AddTransient<IGetActivityByIdUseCase, GetActivityByIdUseCase>();

builder.Services.AddTransient<IViewActivityByCriteriaUseCase, ViewActivityByCriteriaUseCase>();
builder.Services.AddTransient<IViewActivityNextByIdUseCase, ViewActivityNextByIdUseCase>();
builder.Services.AddTransient<IViewActivityPrevByIdUseCase, ViewActivityPrevByIdUseCase>();

builder.Services.AddTransient<IAddActivityUseCase, AddActivityUseCase>();
builder.Services.AddTransient<IEditActivityUseCase, EditActivityUseCase>();
builder.Services.AddTransient<ICloneActivityUseCase, CloneActivityUseCase>();
builder.Services.AddTransient<IDeleteActivityUseCase, DeleteActivityUseCase>();

builder.Services.AddTransient<ICreateActivityPdfUseCase, CreateActivityPdfUseCase>();
builder.Services.AddTransient<ISendActivityViaEmailUseCase, SendActivityViaEmailUseCase>();

//Tags
builder.Services.AddTransient<IGetTagByIdUseCase, GetTagByIdUseCase>();
builder.Services.AddTransient<IViewTagsUseCase, ViewTagsUseCase>();
builder.Services.AddTransient<IViewTagByIdUseCase, ViewTagByIdUseCase>();
builder.Services.AddTransient<IViewTagByParentTagIdUseCase, ViewTagByParentTagIdUseCase>();
builder.Services.AddTransient<IAddTagUseCase, AddTagUseCase>();
builder.Services.AddTransient<IEditTagUseCase, EditTagUseCase>();
builder.Services.AddTransient<IDeleteTagUseCase, DeleteTagUseCase>();

//Equipments
builder.Services.AddTransient<IViewEquipmentsUseCase, ViewEquipmentsUseCase>();
builder.Services.AddTransient<IViewEquipmentByIdUseCase, ViewEquipmentByIdUseCase>();
builder.Services.AddTransient<IAddEquipmentUseCase, AddEquipmentUseCase>();
builder.Services.AddTransient<IEditEquipmentUseCase, EditEquipmentUseCase>();
builder.Services.AddTransient<IDeleteEquipmentUseCase, DeleteEquipmentUseCase>();

//Places
builder.Services.AddTransient<IViewPlacesUseCase, ViewPlacesUseCase>();
builder.Services.AddTransient<IViewPlaceByIdUseCase, ViewPlaceByIdUseCase>();
builder.Services.AddTransient<IAddPlaceUseCase, AddPlaceUseCase>();
builder.Services.AddTransient<IEditPlaceUseCase, EditPlaceUseCase>();
builder.Services.AddTransient<IDeletePlaceUseCase, DeletePlaceUseCase>();

//AgeGroups
builder.Services.AddTransient<IViewAgeGroupsUseCase, ViewAgeGroupsUseCase>();
builder.Services.AddTransient<IViewAgeGroupByIdUseCase, ViewAgeGroupByIdUseCase>();

//FileHandling
builder.Services.AddSingleton<IFileHandlingService, FileHandlingService>();

//SignalR
builder.Services.AddSignalR(o =>
{
    o.EnableDetailedErrors = true;
    o.MaximumReceiveMessageSize = long.MaxValue;
});

//Email settings
var emailConfig = builder.Configuration
    .GetSection("EmailConfiguration")
    .Get<EmailConfiguration>();
builder.Services.AddSingleton(emailConfig ?? throw new Exception("Missing email configuration"));
builder.Services.AddScoped<IEmailSender, EmailSender>();
builder.Services.Configure<FormOptions>(o =>
{
    o.ValueLengthLimit = int.MaxValue;
    o.MultipartBodyLengthLimit = int.MaxValue;
    o.MemoryBufferThreshold = int.MaxValue;
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

//Automapper
builder.Services.AddAutoMapper(typeof(Program).Assembly, typeof(FloorballTraining.UseCases.Helpers.MappingProfiles).Assembly);

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
