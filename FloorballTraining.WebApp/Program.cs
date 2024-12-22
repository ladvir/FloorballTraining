using System.Diagnostics;
using System.Text.Json.Serialization;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Factories;
using FloorballTraining.Services;
using FloorballTraining.Services.EmailService;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.AgeGroups;
using FloorballTraining.UseCases.Appointments;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Clubs;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.Dashboard;
using FloorballTraining.UseCases.Dashboard.Interfaces;
using FloorballTraining.UseCases.Equipments;
using FloorballTraining.UseCases.Equipments.Interfaces;
using FloorballTraining.UseCases.Errors;
using FloorballTraining.UseCases.Errors.Interfaces;
using FloorballTraining.UseCases.Members;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.Places;
using FloorballTraining.UseCases.Places.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Tags;
using FloorballTraining.UseCases.TeamMembers;
using FloorballTraining.UseCases.TeamMembers.Interfaces;
using FloorballTraining.UseCases.Teams;
using FloorballTraining.UseCases.Teams.Interfaces;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.WebApp;
using FloorballTraining.WebApp.Controls.Activities;
using FluentValidation;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using MudBlazor;
using MudBlazor.Services;
using Radzen;


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
            opt => opt
                .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
                .UseRelationalNulls());

    if (builder.Environment.IsEnvironment("TEST") || builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
    }
}, ServiceLifetime.Scoped);

builder.Configuration.AddJsonFile("appsettingssecrets.json", optional: true, reloadOnChange: true);

builder.Configuration.Bind(appSettings);

builder.Services.AddSingleton(appSettings);



//Repositories
builder.Services.AddScoped<IClubRepository, ClubEFCoreRepository>();
builder.Services.AddScoped<ITeamRepository, TeamEFCoreRepository>();
builder.Services.AddScoped<IMemberRepository, MemberEFCoreRepository>();

builder.Services.AddScoped<ITeamMemberRepository, TeamMemberEFCoreRepository>();
builder.Services.AddScoped<IAppointmentRepository, AppointmentEFCoreRepository>();
builder.Services.AddScoped<IRepeatingPatternRepository, RepeatingPatternEFCoreRepository>();



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
builder.Services.AddScoped<IActivityAgeGroupRepository, ActivityAgeGroupEFCoreRepository>();


//factories
builder.Services.AddScoped<IClubFactory, ClubEFCoreFactory>();
builder.Services.AddScoped<ITeamFactory, TeamEFCoreFactory>();
builder.Services.AddScoped<IMemberFactory, MemberEFCoreFactory>();
builder.Services.AddScoped<ITeamMemberFactory, TeamMemberEFCoreFactory>();
builder.Services.AddScoped<IAppointmentFactory, AppointmentEFCoreFactory>();


builder.Services.AddScoped<IEquipmentFactory, EquipmentEFCoreFactory>();
builder.Services.AddScoped<IPlaceFactory, PlaceEFCoreFactory>();
builder.Services.AddScoped<IAgeGroupFactory, AgeGroupEFCoreFactory>();
builder.Services.AddScoped<ITagFactory, TagEFCoreFactory>();
builder.Services.AddScoped<IActivityFactory, ActivityEFCoreFactory>();
builder.Services.AddScoped<IActivityTagFactory, ActivityTagEFCoreFactory>();
builder.Services.AddScoped<IActivityEquipmentFactory, ActivityEquipmentEFCoreFactory>();
builder.Services.AddScoped<IActivityMediaFactory, ActivityMediaEFCoreFactory>();
builder.Services.AddScoped<IActivityAgeGroupFactory, ActivityAgeGroupEFCoreFactory>();
builder.Services.AddScoped<ITrainingFactory, TrainingEFCoreFactory>();
builder.Services.AddScoped<ITrainingPartFactory, TrainingPartEFCoreFactory>();
builder.Services.AddScoped<ITrainingGroupFactory, TrainingGroupEFCoreFactory>();
builder.Services.AddScoped<IRepeatingPatternFactory, RepeatingPatternEFCoreFactory>();


// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();
builder.Services.AddMudServices();

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

});


builder.Services.AddRadzenComponents();

//Appointments
builder.Services.AddScoped<IAppointmentFactory, AppointmentEFCoreFactory>();


//Trainings
builder.Services.AddValidatorsFromAssemblyContaining<TrainingValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<TrainingPartValidator>();

builder.Services.AddTransient<IViewTrainingsAllUseCase, ViewTrainingsAllUseCase>();
builder.Services.AddTransient<IViewTrainingsUseCase, ViewTrainingsUseCase>();
builder.Services.AddTransient<IViewTrainingByIdUseCase, ViewTrainingByIdUseCase>();
builder.Services.AddTransient<IAddTrainingUseCase, AddTrainingUseCase>();
builder.Services.AddTransient<IEditTrainingUseCase, EditTrainingUseCase>();
builder.Services.AddTransient<ICloneTrainingUseCase, CloneTrainingUseCase>();
builder.Services.AddTransient<IViewTrainingEquipmentUseCase, ViewTrainingEquipmentUseCase>();

builder.Services.AddTransient<ISendTrainingViaEmailUseCase, SendTrainingViaEmailUseCase>();
builder.Services.AddTransient<IDeleteTrainingUseCase, DeleteTrainingUseCase>();

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


builder.Services.AddTransient<ISendActivityViaEmailUseCase, SendActivityViaEmailUseCase>();

//Clubs
builder.Services.AddTransient<IViewClubByIdUseCase, ViewClubByIdUseCase>();
builder.Services.AddTransient<IViewClubsUseCase, ViewClubsUseCase>();
builder.Services.AddTransient<IViewClubsAllUseCase, ViewClubsAllUseCase>();
builder.Services.AddTransient<IAddClubUseCase, AddClubUseCase>();
builder.Services.AddTransient<IEditClubUseCase, EditClubUseCase>();
builder.Services.AddTransient<IDeleteClubUseCase, DeleteClubUseCase>();
builder.Services.AddTransient<IViewClubsAllSimpleUseCase, ViewClubsAllSimpleUseCase>();


//Teams
builder.Services.AddTransient<IViewTeamsAllUseCase, ViewTeamsAllUseCase>();
builder.Services.AddTransient<IViewTeamsWithSpecificationUseCase, ViewTeamsWithSpecificationUseCase>();
builder.Services.AddTransient<IAddTeamUseCase, AddTeamUseCase>();
builder.Services.AddTransient<IDeleteTeamUseCase, DeleteTeamUseCase>();

builder.Services.AddTransient<IViewTeamByIdUseCase, ViewTeamByIdUseCase>();
builder.Services.AddTransient<IEditTeamUseCase, EditTeamUseCase>();
builder.Services.AddTransient<IViewTeamsAllSimpleUseCase, ViewTeamsAllSimpleUseCase>();


//Members
builder.Services.AddTransient<IViewMembersAllUseCase, ViewMembersAllUseCase>();
builder.Services.AddTransient<IViewMembersWithSpecificationUseCase, ViewMembersWithSpecificationUseCase>();
builder.Services.AddTransient<IAddMemberUseCase, AddMemberUseCase>();
builder.Services.AddTransient<IDeleteMemberUseCase, DeleteMemberUseCase>();
builder.Services.AddTransient<IViewMemberByIdUseCase, ViewMemberByIdUseCase>();
builder.Services.AddTransient<IEditMemberUseCase, EditMemberUseCase>();


//TeamMembers
builder.Services.AddTransient<IViewTeamMembersAllUseCase, ViewTeamMembersAllUseCase>();
builder.Services.AddTransient<IViewTeamMembersWithSpecificationUseCase, ViewTeamMembersWithSpecificationUseCase>();
builder.Services.AddTransient<IAddTeamMemberUseCase, AddTeamMemberUseCase>();
builder.Services.AddTransient<IDeleteTeamMemberUseCase, DeleteTeamMemberUseCase>();
builder.Services.AddTransient<IViewTeamMemberByIdUseCase, ViewTeamMemberByIdUseCase>();
builder.Services.AddTransient<IEditTeamMemberUseCase, EditTeamMemberUseCase>();


//Tags
builder.Services.AddTransient<IGetTagByIdUseCase, GetTagByIdUseCase>();
builder.Services.AddTransient<IViewTagsWithSpecificationUseCase, ViewTagsWithSpecificationUseCase>();
builder.Services.AddTransient<IViewTagByIdUseCase, ViewTagByIdUseCase>();
builder.Services.AddTransient<IViewTagByParentTagIdUseCase, ViewTagByParentTagIdUseCase>();
builder.Services.AddTransient<IAddTagUseCase, AddTagUseCase>();
builder.Services.AddTransient<IEditTagUseCase, EditTagUseCase>();
builder.Services.AddTransient<IDeleteTagUseCase, DeleteTagUseCase>();
builder.Services.AddTransient<IViewTagsAllUseCase, ViewTagsAllUseCase>();

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
builder.Services.AddTransient<IViewAgeGroupsAllUseCase, ViewAgeGroupsAllUseCase>();
builder.Services.AddTransient<IViewAgeGroupsUseCase, ViewAgeGroupsUseCase>();
builder.Services.AddTransient<IViewAgeGroupByIdUseCase, ViewAgeGroupByIdUseCase>();

//DashBoard
builder.Services.AddTransient<IGetDashBoardDataUseCase, GetDashBoardDataUseCase>();

//Appointments
builder.Services.AddTransient<IViewAppointmentsAllUseCase, ViewAppointmentsAllUseCase>();
builder.Services.AddTransient<IViewAppointmentsUseCase, ViewAppointmentsUseCase>();
builder.Services.AddTransient<IViewAppointmentByIdUseCase, ViewAppointmentByIdUseCase>();
builder.Services.AddTransient<IAddAppointmentUseCase, AddAppointmentUseCase>();
builder.Services.AddTransient<IEditAppointmentUseCase, EditAppointmentUseCase>();
builder.Services.AddTransient<IDeleteAppointmentUseCase, DeleteAppointmentUseCase>();
builder.Services.AddSingleton<IAppointmentService, AppointmentService>();
//FileHandling
builder.Services.AddSingleton<IFileHandlingService, FileHandlingService>();

//Errors handling
builder.Services.AddTransient<ISendErrorViaEmailUseCase, SendErrorViaEmailUseCase>();

//Export 
builder.Services.AddTransient(typeof(IExportService<>),typeof(ExportService<>));
builder.Services.AddTransient(typeof(ICreatePdfUseCase<ActivityDto>),typeof(CreateActivityPdfUseCase));
builder.Services.AddTransient(typeof(ICreatePdfUseCase<TrainingDto>),typeof(CreateTrainingPdfUseCase));
//builder.Services.AddTransient<ICreateTrainingPdfUseCase, CreateTrainingPdfUseCase>();

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
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.UseAntiforgery();
app.Run();
