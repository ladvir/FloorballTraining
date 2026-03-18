using System.Text;
using System.Text.Json.Serialization;
using FloorballTraining.API.Errors;
using FloorballTraining.API.Middlewares;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
//using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Factories;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.Services;
using FloorballTraining.Services.EmailService;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Dashboard;
using FloorballTraining.UseCases.Dashboard.Interfaces;
using FloorballTraining.UseCases.AgeGroups;
using FloorballTraining.UseCases.Appointments;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Clubs;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.Equipments;
using FloorballTraining.UseCases.Equipments.Interfaces;
using FloorballTraining.UseCases.Members;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.Places;
using FloorballTraining.UseCases.Places.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Seasons;
using FloorballTraining.UseCases.Seasons.Interfaces;
using FloorballTraining.UseCases.Tags;
using FloorballTraining.UseCases.TeamMembers;
using FloorballTraining.UseCases.TeamMembers.Interfaces;
using FloorballTraining.UseCases.Teams;
using FloorballTraining.UseCases.Teams.Interfaces;
using FloorballTraining.UseCases.Trainings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

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
appSettings.AssetsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icons") + Path.DirectorySeparatorChar;

builder.Services.AddDbContextFactory<FloorballTrainingContext>(options =>
{
    options

        .UseSqlServer(builder.Configuration.GetConnectionString("FloorballTraining"),
            opt => opt
                .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
                .UseRelationalNulls()
                .EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null));

    if (builder.Environment.IsEnvironment("TEST") || builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
    }

}, ServiceLifetime.Scoped);

// Identity
builder.Services.AddIdentityCore<AppUser>(opt =>
    {
        opt.Password.RequireNonAlphanumeric = false;
        opt.Password.RequiredLength = 6;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<FloorballTrainingContext>()
    .AddDefaultTokenProviders();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            ValidateLifetime = true
        };
    });

builder.Services.AddScoped<TokenService>();

builder.Configuration.AddJsonFile("appsettingssecrets.json", optional: true, reloadOnChange: true);


builder.Configuration.Bind(appSettings);

builder.Services.AddSingleton(appSettings);

//Generic repository
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericEFCoreRepository<>));




    //Repositories
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
    builder.Services.AddScoped<IClubRepository, ClubEFCoreRepository>();
    builder.Services.AddScoped<ITeamRepository, TeamEFCoreRepository>();
    builder.Services.AddScoped<IMemberRepository, MemberEFCoreRepository>();
    builder.Services.AddScoped<ITeamMemberRepository, TeamMemberEFCoreRepository>();
    builder.Services.AddScoped<IAppointmentRepository, AppointmentEFCoreRepository>();
    builder.Services.AddScoped<IRepeatingPatternRepository, RepeatingPatternEFCoreRepository>();

    builder.Services.AddScoped<ISeasonRepository, SeasonEFCoreRepository>();
    //factories
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
    builder.Services.AddScoped<ISeasonFactory, SeasonEFCoreFactory>();
    builder.Services.AddScoped<IClubFactory, ClubEFCoreFactory>();
    builder.Services.AddScoped<ITeamFactory, TeamEFCoreFactory>();
    builder.Services.AddScoped<IMemberFactory, MemberEFCoreFactory>();
    builder.Services.AddScoped<ITeamMemberFactory, TeamMemberEFCoreFactory>();
    builder.Services.AddScoped<IAppointmentFactory, AppointmentEFCoreFactory>();
    builder.Services.AddScoped<IRepeatingPatternFactory, RepeatingPatternEFCoreFactory>();




// Add services to the container.
//Trainings
builder.Services.AddTransient<IViewTrainingsAllUseCase, ViewTrainingsAllUseCase>();
builder.Services.AddTransient<IViewTrainingsUseCase, ViewTrainingsUseCase>();
builder.Services.AddTransient<IViewTrainingByIdUseCase, ViewTrainingByIdUseCase>();
builder.Services.AddTransient<IAddTrainingUseCase, AddTrainingUseCase>();
builder.Services.AddTransient<IEditTrainingUseCase, EditTrainingUseCase>();
builder.Services.AddTransient<ICloneTrainingUseCase, CloneTrainingUseCase>();
builder.Services.AddTransient<IViewTrainingEquipmentUseCase, ViewTrainingEquipmentUseCase>();

builder.Services.AddTransient<ISendTrainingViaEmailUseCase, SendTrainingViaEmailUseCase>();
builder.Services.AddTransient<IDeleteTrainingUseCase, DeleteTrainingUseCase>();
builder.Services.AddTransient<ICreatePdfUseCase<TrainingDto>, CreateTrainingPdfUseCase>();
builder.Services.AddTransient<IValidateTrainingUseCase, ValidateTrainingUseCase>();
builder.Services.AddTransient<IValidateAllTrainingsUseCase, ValidateAllTrainingsUseCase>();


//Seasons
builder.Services.AddTransient<IViewSeasonsAllUseCase, ViewSeasonsAllUseCase>();
builder.Services.AddTransient<IAddSeasonUseCase, AddSeasonUseCase>();
builder.Services.AddTransient<IEditSeasonUseCase, EditSeasonUseCase>();
builder.Services.AddTransient<IDeleteSeasonUseCase, DeleteSeasonUseCase>();
builder.Services.AddTransient<IViewSeasonByIdUseCase, ViewSeasonByIdUseCase>();

//Activities
builder.Services.AddTransient<IViewActivitiesUseCase, ViewActivitiesUseCase>();
builder.Services.AddTransient<IViewActivitiesAllUseCase, ViewActivitiesAllUseCase>();
builder.Services.AddTransient<IViewActivityByIdUseCase, ViewActivityByIdUseCase>();

builder.Services.AddTransient<IGetActivityByIdUseCase, GetActivityByIdUseCase>();

builder.Services.AddTransient<IViewActivitiesBaseUseCase, ViewActivitiesBaseUseCase>();
builder.Services.AddTransient<IViewActivityBaseByIdUseCase, ViewActivityBaseByIdUseCase>();

builder.Services.AddTransient<IViewActivityByCriteriaUseCase, ViewActivityByCriteriaUseCase>();

builder.Services.AddTransient<IViewActivityNextByIdUseCase, ViewActivityNextByIdUseCase>();
builder.Services.AddTransient<IViewActivityPrevByIdUseCase, ViewActivityPrevByIdUseCase>();

builder.Services.AddTransient<IAddActivityUseCase, AddActivityUseCase>();
builder.Services.AddTransient<IEditActivityUseCase, EditActivityUseCase>();
builder.Services.AddTransient<ICloneActivityUseCase, CloneActivityUseCase>();
builder.Services.AddTransient<IDeleteActivityUseCase, DeleteActivityUseCase>();
builder.Services.AddTransient<IValidateActivityUseCase, ValidateActivityUseCase>();
builder.Services.AddTransient<IValidateAllActivitiesUseCase, ValidateAllActivitiesUseCase>();

builder.Services.AddTransient<ISendActivityViaEmailUseCase, SendActivityViaEmailUseCase>();
builder.Services.AddTransient<ICreatePdfUseCase<ActivityDto>, CreateActivityPdfUseCase>();

//Dashboard
builder.Services.AddTransient<IGetDashBoardDataUseCase, GetDashBoardDataUseCase>();

//Tags
builder.Services.AddTransient<IViewTagsWithSpecificationUseCase, ViewTagsWithSpecificationUseCase>();
builder.Services.AddTransient<IViewTagsAllUseCase, ViewTagsAllUseCase>();
builder.Services.AddTransient<IViewTagByIdUseCase, ViewTagByIdUseCase>();
builder.Services.AddTransient<IViewTagByParentTagIdUseCase, ViewTagByParentTagIdUseCase>();
builder.Services.AddTransient<IAddTagUseCase, AddTagUseCase>();
builder.Services.AddTransient<IEditTagUseCase, EditTagUseCase>();
builder.Services.AddTransient<IDeleteTagUseCase, DeleteTagUseCase>();


//Equipments
builder.Services.AddTransient<IViewEquipmentsUseCase, ViewEquipmentsUseCase>();
builder.Services.AddTransient<IViewEquipmentsAllUseCase, ViewEquipmentsAllUseCase>();
builder.Services.AddTransient<IViewEquipmentByIdUseCase, ViewEquipmentByIdUseCase>();
builder.Services.AddTransient<IAddEquipmentUseCase, AddEquipmentUseCase>();
builder.Services.AddTransient<IEditEquipmentUseCase, EditEquipmentUseCase>();
builder.Services.AddTransient<IDeleteEquipmentUseCase, DeleteEquipmentUseCase>();

//Places
builder.Services.AddTransient<IViewPlacesUseCase, ViewPlacesUseCase>();
builder.Services.AddTransient<IViewPlacesAllUseCase, ViewPlacesAllUseCase>();
builder.Services.AddTransient<IViewPlaceByIdUseCase, ViewPlaceByIdUseCase>();
builder.Services.AddTransient<IAddPlaceUseCase, AddPlaceUseCase>();
builder.Services.AddTransient<IEditPlaceUseCase, EditPlaceUseCase>();
builder.Services.AddTransient<IDeletePlaceUseCase, DeletePlaceUseCase>();

//AgeGroups
builder.Services.AddTransient<IViewAgeGroupsAllUseCase, ViewAgeGroupsAllUseCase>();
builder.Services.AddTransient<IViewAgeGroupsUseCase, ViewAgeGroupsUseCase>();
builder.Services.AddTransient<IViewAgeGroupByIdUseCase, ViewAgeGroupByIdUseCase>();

// Use Cases - Clubs
builder.Services.AddTransient<IViewClubByIdUseCase, ViewClubByIdUseCase>();
builder.Services.AddTransient<IViewClubsUseCase, ViewClubsUseCase>();
builder.Services.AddTransient<IViewClubsAllUseCase, ViewClubsAllUseCase>();
builder.Services.AddTransient<IAddClubUseCase, AddClubUseCase>();
builder.Services.AddTransient<IEditClubUseCase, EditClubUseCase>();
builder.Services.AddTransient<IDeleteClubUseCase, DeleteClubUseCase>();
builder.Services.AddTransient<IViewClubsAllSimpleUseCase, ViewClubsAllSimpleUseCase>();

// Use Cases - Teams
builder.Services.AddTransient<IViewTeamsAllUseCase, ViewTeamsAllUseCase>();
builder.Services.AddTransient<IViewTeamsWithSpecificationUseCase, ViewTeamsWithSpecificationUseCase>();
builder.Services.AddTransient<IAddTeamUseCase, AddTeamUseCase>();
builder.Services.AddTransient<IDeleteTeamUseCase, DeleteTeamUseCase>();
builder.Services.AddTransient<IViewTeamByIdUseCase, ViewTeamByIdUseCase>();
builder.Services.AddTransient<IEditTeamUseCase, EditTeamUseCase>();
builder.Services.AddTransient<IViewTeamsAllSimpleUseCase, ViewTeamsAllSimpleUseCase>();

// Use Cases - Members
builder.Services.AddTransient<IViewMembersAllUseCase, ViewMembersAllUseCase>();
builder.Services.AddTransient<IViewMembersWithSpecificationUseCase, ViewMembersWithSpecificationUseCase>();
builder.Services.AddTransient<IAddMemberUseCase, AddMemberUseCase>();
builder.Services.AddTransient<IDeleteMemberUseCase, DeleteMemberUseCase>();
builder.Services.AddTransient<IViewMemberByIdUseCase, ViewMemberByIdUseCase>();
builder.Services.AddTransient<IEditMemberUseCase, EditMemberUseCase>();

// Use Cases - TeamMembers
builder.Services.AddTransient<IViewTeamMembersAllUseCase, ViewTeamMembersAllUseCase>();
builder.Services.AddTransient<IViewTeamMembersWithSpecificationUseCase, ViewTeamMembersWithSpecificationUseCase>();
builder.Services.AddTransient<IAddTeamMemberUseCase, AddTeamMemberUseCase>();
builder.Services.AddTransient<IDeleteTeamMemberUseCase, DeleteTeamMemberUseCase>();
builder.Services.AddTransient<IViewTeamMemberByIdUseCase, ViewTeamMemberByIdUseCase>();
builder.Services.AddTransient<IEditTeamMemberUseCase, EditTeamMemberUseCase>();

// Use Cases - Appointments
builder.Services.AddTransient<IViewAppointmentsAllUseCase, ViewAppointmentsAllUseCase>();
builder.Services.AddTransient<IViewAppointmentsUseCase, ViewAppointmentsUseCase>();
builder.Services.AddTransient<IViewAppointmentByIdUseCase, ViewAppointmentByIdUseCase>();
builder.Services.AddTransient<IAddAppointmentUseCase, AddAppointmentUseCase>();
builder.Services.AddTransient<IEditAppointmentUseCase, EditAppointmentUseCase>();
builder.Services.AddTransient<IDeleteAppointmentUseCase, DeleteAppointmentUseCase>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
//FileHandling
builder.Services.AddSingleton<IFileHandlingService, FileHandlingService>();



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

builder.Services.AddControllers(options =>
    {
        options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });




builder.Services.AddEndpointsApiExplorer();



//Automapper
builder.Services.AddAutoMapper(typeof(Program).Assembly, typeof(FloorballTraining.UseCases.Helpers.MappingProfiles).Assembly);


//validation error collecting
builder.Services.Configure<ApiBehaviorOptions>(options => options.InvalidModelStateResponseFactory = actionContext =>
{
    var errors = actionContext.ModelState.Where(e => e.Value?.Errors.Count > 0 && e.Value?.Errors != null).SelectMany(x => x.Value?.Errors!)
        .Select(x => x.ErrorMessage).ToArray();

    var errorResponse = new ApiValidationErrorResponse()
    {
        Errors = errors
    };

    return new BadRequestObjectResult(errorResponse);
});



//CORS
builder.Services.AddCors(o =>
    {
        o.AddPolicy("CorsPolicy", policy => policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowAnyOrigin()
        //.WithOrigins("https://localhost:4200/", "https://localhost:7055/")
        );
    }
);


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
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Chyba při seedování databáze");
}

app.Run();
