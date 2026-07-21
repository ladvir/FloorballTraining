using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using FloorballTraining.API.Authorization;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using FloorballTraining.API.Errors;
using FloorballTraining.API.Jobs;
using Hangfire;
using Hangfire.InMemory;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authorization;
using FloorballTraining.API.Services;
using FloorballTraining.API.Services.Ai;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
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
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace FloorballTraining.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddSingleton<AuditableInterceptor>(sp =>
        {
            var accessor = sp.GetRequiredService<IHttpContextAccessor>();
            return new AuditableInterceptor(
                () => accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier));
        });

        services.AddDbContextFactory<FloorballTrainingContext>((sp, options) =>
        {
            options
                .AddInterceptors(sp.GetRequiredService<AuditableInterceptor>())
                .UseSqlServer(configuration.GetConnectionString("FloorballTraining"),
                    opt => opt
                        .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
                        .UseRelationalNulls()
                        .EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null));

            if (environment.IsEnvironment("TEST") || environment.IsDevelopment())
            {
                options.EnableSensitiveDataLogging();
            }
        }, ServiceLifetime.Scoped);

        // Generic repository
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericEFCoreRepository<>));

        // Repositories
        services.AddScoped<IActivityRepository, ActivityEfCoreRepository>();
        services.AddScoped<ITagRepository, TagEFCoreRepository>();
        services.AddScoped<IEquipmentRepository, EquipmentEFCoreRepository>();
        services.AddScoped<ITrainingRepository, TrainingEFCoreRepository>();
        services.AddScoped<IAgeGroupRepository, AgeGroupEFCoreRepository>();
        services.AddScoped<IPlaceRepository, PlaceEFCoreRepository>();
        services.AddScoped<ITrainingPartRepository, TrainingPartEFCoreRepository>();
        services.AddScoped<ITrainingGroupRepository, TrainingGroupEFCoreRepository>();
        services.AddScoped<IActivityTagRepository, ActivityTagEFCoreRepository>();
        services.AddScoped<IActivityEquipmentRepository, ActivityEquipmentEFCoreRepository>();
        services.AddScoped<IActivityMediaRepository, ActivityMediaEFCoreRepository>();
        services.AddScoped<IActivityAgeGroupRepository, ActivityAgeGroupEFCoreRepository>();
        services.AddScoped<IClubRepository, ClubEFCoreRepository>();
        services.AddScoped<ITeamRepository, TeamEFCoreRepository>();
        services.AddScoped<IMemberRepository, MemberEFCoreRepository>();
        services.AddScoped<ITeamMemberRepository, TeamMemberEFCoreRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentEFCoreRepository>();
        services.AddScoped<IRepeatingPatternRepository, RepeatingPatternEFCoreRepository>();
        services.AddScoped<ISeasonRepository, SeasonEFCoreRepository>();

        // Factories
        services.AddScoped<IEquipmentFactory, EquipmentEFCoreFactory>();
        services.AddScoped<IPlaceFactory, PlaceEFCoreFactory>();
        services.AddScoped<IAgeGroupFactory, AgeGroupEFCoreFactory>();
        services.AddScoped<ITagFactory, TagEFCoreFactory>();
        services.AddScoped<IActivityFactory, ActivityEFCoreFactory>();
        services.AddScoped<IActivityTagFactory, ActivityTagEFCoreFactory>();
        services.AddScoped<IActivityEquipmentFactory, ActivityEquipmentEFCoreFactory>();
        services.AddScoped<IActivityMediaFactory, ActivityMediaEFCoreFactory>();
        services.AddScoped<IActivityAgeGroupFactory, ActivityAgeGroupEFCoreFactory>();
        services.AddScoped<ITrainingFactory, TrainingEFCoreFactory>();
        services.AddScoped<ITrainingPartFactory, TrainingPartEFCoreFactory>();
        services.AddScoped<ITrainingGroupFactory, TrainingGroupEFCoreFactory>();
        services.AddScoped<ISeasonFactory, SeasonEFCoreFactory>();
        services.AddScoped<IClubFactory, ClubEFCoreFactory>();
        services.AddScoped<ITeamFactory, TeamEFCoreFactory>();
        services.AddScoped<IMemberFactory, MemberEFCoreFactory>();
        services.AddScoped<ITeamMemberFactory, TeamMemberEFCoreFactory>();
        services.AddScoped<IAppointmentFactory, AppointmentEFCoreFactory>();
        services.AddScoped<IRepeatingPatternFactory, RepeatingPatternEFCoreFactory>();

        return services;
    }

    public static IServiceCollection AddIdentityAndAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddIdentityCore<AppUser>(opt =>
            {
                opt.Password.RequireNonAlphanumeric = false;
                opt.Password.RequiredLength = 6;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<FloorballTrainingContext>()
            .AddDefaultTokenProviders();

        var authBuilder = services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["JwtSettings:SecretKey"]!)),
                    ValidateIssuer = true,
                    ValidIssuer = configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = configuration["JwtSettings:Audience"],
                    ValidateLifetime = true
                };
                // SignalR WebSocket can't send headers; read token from query string instead.
                options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var token = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(token) &&
                            context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                        {
                            context.Token = token;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        // Only register OAuth schemes when credentials are configured — an empty ClientId
        // causes OAuthOptions.Validate() to throw on every request through AuthenticationMiddleware.
        var googleClientId = configuration["OAuth:Google:ClientId"];
        if (!string.IsNullOrEmpty(googleClientId))
        {
            authBuilder.AddGoogle(options =>
            {
                options.ClientId = googleClientId;
                options.ClientSecret = configuration["OAuth:Google:ClientSecret"] ?? "";
                options.CallbackPath = "/auth/external/google/callback";
            });
        }

        var msClientId = configuration["OAuth:Microsoft:ClientId"];
        if (!string.IsNullOrEmpty(msClientId))
        {
            authBuilder.AddMicrosoftAccount(options =>
            {
                options.ClientId = msClientId;
                options.ClientSecret = configuration["OAuth:Microsoft:ClientSecret"] ?? "";
                options.CallbackPath = "/auth/external/microsoft/callback";
            });
        }

        services.AddSignalR();

        services.AddScoped<SignInManager<AppUser>>();
        services.AddScoped<TokenService>();
        services.AddHttpContextAccessor();
        services.AddScoped<IAuditService, AuditService>();

        services.AddScoped<IAuthorizationHandler, ClubRoleHandler>();
        services.AddAuthorization(options =>
        {
            options.AddPolicy(Policies.MinCoach,     p => p.AddRequirements(new ClubRoleRequirement("Coach")));
            options.AddPolicy(Policies.MinHeadCoach, p => p.AddRequirements(new ClubRoleRequirement("HeadCoach")));
            options.AddPolicy(Policies.MinClubAdmin, p => p.AddRequirements(new ClubRoleRequirement("ClubAdmin")));
            options.AddPolicy(Policies.AdminOnly,    p => p.AddRequirements(new ClubRoleRequirement("Admin")));
        });
        services.AddScoped<IClubRoleService, ClubRoleService>();
        services.AddScoped<IPlayerPositionResolver, LineupInferredPlayerPositionResolver>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddHttpClient();
        services.AddScoped<IICalImportService, ICalImportService>();

        return services;
    }

    public static IServiceCollection AddAiServices(this IServiceCollection services)
    {
        // Key ring persisted in the DB: survives IIS app-pool recycles/redeploys and is
        // backed up with the data it protects. Losing these rows would brick every stored
        // AI API key (surfaced as needsReentry, never a 500).
        services.AddDataProtection()
            .PersistKeysToDbContext<FloorballTrainingContext>()
            .SetApplicationName("FloTr");

        services.AddScoped<IAiCredentialProtector, AiCredentialProtector>();
        services.AddSingleton<IAiClientFactory, AiClientFactory>();
        services.AddScoped<IAiCredentialResolver, AiCredentialResolver>();
        services.AddScoped<IAiUsageLogger, AiUsageLogger>();

        return services;
    }

    public static IServiceCollection AddUseCases(this IServiceCollection services)
    {
        // Trainings
        services.AddTransient<IViewTrainingsAllUseCase, ViewTrainingsAllUseCase>();
        services.AddTransient<IViewTrainingsUseCase, ViewTrainingsUseCase>();
        services.AddTransient<IViewTrainingByIdUseCase, ViewTrainingByIdUseCase>();
        services.AddTransient<IAddTrainingUseCase, AddTrainingUseCase>();
        services.AddTransient<IEditTrainingUseCase, EditTrainingUseCase>();
        services.AddTransient<ICloneTrainingUseCase, CloneTrainingUseCase>();
        services.AddTransient<IViewTrainingEquipmentUseCase, ViewTrainingEquipmentUseCase>();
        services.AddTransient<ISendTrainingViaEmailUseCase, SendTrainingViaEmailUseCase>();
        services.AddTransient<IDeleteTrainingUseCase, DeleteTrainingUseCase>();
        services.AddTransient<ICreatePdfUseCase<TrainingDto>, CreateTrainingPdfUseCase>();
        services.AddTransient<IValidateTrainingUseCase, ValidateTrainingUseCase>();
        services.AddTransient<IValidateAllTrainingsUseCase, ValidateAllTrainingsUseCase>();
        services.AddTransient<FloorballTraining.UseCases.Trainings.Interfaces.ITrainingSimilarityService, FloorballTraining.UseCases.Trainings.TrainingSimilarityService>();

        // Seasons
        services.AddTransient<IViewSeasonsAllUseCase, ViewSeasonsAllUseCase>();
        services.AddTransient<IAddSeasonUseCase, AddSeasonUseCase>();
        services.AddTransient<IEditSeasonUseCase, EditSeasonUseCase>();
        services.AddTransient<IDeleteSeasonUseCase, DeleteSeasonUseCase>();
        services.AddTransient<IViewSeasonByIdUseCase, ViewSeasonByIdUseCase>();

        // Activities
        services.AddTransient<IViewActivitiesUseCase, ViewActivitiesUseCase>();
        services.AddTransient<IViewActivitiesAllUseCase, ViewActivitiesAllUseCase>();
        services.AddTransient<IViewActivityByIdUseCase, ViewActivityByIdUseCase>();
        services.AddTransient<IGetActivityByIdUseCase, GetActivityByIdUseCase>();
        services.AddTransient<IViewActivitiesBaseUseCase, ViewActivitiesBaseUseCase>();
        services.AddTransient<IViewActivityBaseByIdUseCase, ViewActivityBaseByIdUseCase>();
        services.AddTransient<IViewActivityByCriteriaUseCase, ViewActivityByCriteriaUseCase>();
        services.AddTransient<IViewActivityNextByIdUseCase, ViewActivityNextByIdUseCase>();
        services.AddTransient<IViewActivityPrevByIdUseCase, ViewActivityPrevByIdUseCase>();
        services.AddTransient<IAddActivityUseCase, AddActivityUseCase>();
        services.AddTransient<IEditActivityUseCase, EditActivityUseCase>();
        services.AddTransient<ICloneActivityUseCase, CloneActivityUseCase>();
        services.AddTransient<IDeleteActivityUseCase, DeleteActivityUseCase>();
        services.AddTransient<IValidateActivityUseCase, ValidateActivityUseCase>();
        services.AddTransient<IValidateAllActivitiesUseCase, ValidateAllActivitiesUseCase>();
        services.AddTransient<ISendActivityViaEmailUseCase, SendActivityViaEmailUseCase>();
        services.AddTransient<ICreatePdfUseCase<ActivityDto>, CreateActivityPdfUseCase>();

        // Dashboard
        services.AddTransient<IGetDashBoardDataUseCase, GetDashBoardDataUseCase>();

        // Tags
        services.AddTransient<IViewTagsWithSpecificationUseCase, ViewTagsWithSpecificationUseCase>();
        services.AddTransient<IViewTagsAllUseCase, ViewTagsAllUseCase>();
        services.AddTransient<IViewTagByIdUseCase, ViewTagByIdUseCase>();
        services.AddTransient<IViewTagByParentTagIdUseCase, ViewTagByParentTagIdUseCase>();
        services.AddTransient<IAddTagUseCase, AddTagUseCase>();
        services.AddTransient<IEditTagUseCase, EditTagUseCase>();
        services.AddTransient<IDeleteTagUseCase, DeleteTagUseCase>();

        // Equipments
        services.AddTransient<IViewEquipmentsUseCase, ViewEquipmentsUseCase>();
        services.AddTransient<IViewEquipmentsAllUseCase, ViewEquipmentsAllUseCase>();
        services.AddTransient<IViewEquipmentByIdUseCase, ViewEquipmentByIdUseCase>();
        services.AddTransient<IAddEquipmentUseCase, AddEquipmentUseCase>();
        services.AddTransient<IEditEquipmentUseCase, EditEquipmentUseCase>();
        services.AddTransient<IDeleteEquipmentUseCase, DeleteEquipmentUseCase>();

        // Places
        services.AddTransient<IViewPlacesUseCase, ViewPlacesUseCase>();
        services.AddTransient<IViewPlacesAllUseCase, ViewPlacesAllUseCase>();
        services.AddTransient<IViewPlaceByIdUseCase, ViewPlaceByIdUseCase>();
        services.AddTransient<IAddPlaceUseCase, AddPlaceUseCase>();
        services.AddTransient<IEditPlaceUseCase, EditPlaceUseCase>();
        services.AddTransient<IDeletePlaceUseCase, DeletePlaceUseCase>();

        // AgeGroups
        services.AddTransient<IViewAgeGroupsAllUseCase, ViewAgeGroupsAllUseCase>();
        services.AddTransient<IViewAgeGroupsUseCase, ViewAgeGroupsUseCase>();
        services.AddTransient<IViewAgeGroupByIdUseCase, ViewAgeGroupByIdUseCase>();

        // Clubs
        services.AddTransient<IViewClubByIdUseCase, ViewClubByIdUseCase>();
        services.AddTransient<IViewClubsUseCase, ViewClubsUseCase>();
        services.AddTransient<IViewClubsAllUseCase, ViewClubsAllUseCase>();
        services.AddTransient<IAddClubUseCase, AddClubUseCase>();
        services.AddTransient<IEditClubUseCase, EditClubUseCase>();
        services.AddTransient<IDeleteClubUseCase, DeleteClubUseCase>();
        services.AddTransient<IViewClubsAllSimpleUseCase, ViewClubsAllSimpleUseCase>();

        // Teams
        services.AddTransient<IViewTeamsAllUseCase, ViewTeamsAllUseCase>();
        services.AddTransient<IViewTeamsWithSpecificationUseCase, ViewTeamsWithSpecificationUseCase>();
        services.AddTransient<IAddTeamUseCase, AddTeamUseCase>();
        services.AddTransient<IDeleteTeamUseCase, DeleteTeamUseCase>();
        services.AddTransient<IViewTeamByIdUseCase, ViewTeamByIdUseCase>();
        services.AddTransient<IEditTeamUseCase, EditTeamUseCase>();
        services.AddTransient<IViewTeamsAllSimpleUseCase, ViewTeamsAllSimpleUseCase>();

        // Members
        services.AddTransient<IViewMembersAllUseCase, ViewMembersAllUseCase>();
        services.AddTransient<IViewMembersWithSpecificationUseCase, ViewMembersWithSpecificationUseCase>();
        services.AddTransient<IAddMemberUseCase, AddMemberUseCase>();
        services.AddTransient<IDeleteMemberUseCase, DeleteMemberUseCase>();
        services.AddTransient<IViewMemberByIdUseCase, ViewMemberByIdUseCase>();
        services.AddTransient<IEditMemberUseCase, EditMemberUseCase>();

        // TeamMembers
        services.AddTransient<IViewTeamMembersAllUseCase, ViewTeamMembersAllUseCase>();
        services.AddTransient<IViewTeamMembersWithSpecificationUseCase, ViewTeamMembersWithSpecificationUseCase>();
        services.AddTransient<IAddTeamMemberUseCase, AddTeamMemberUseCase>();
        services.AddTransient<IDeleteTeamMemberUseCase, DeleteTeamMemberUseCase>();
        services.AddTransient<IViewTeamMemberByIdUseCase, ViewTeamMemberByIdUseCase>();
        services.AddTransient<IEditTeamMemberUseCase, EditTeamMemberUseCase>();

        // Appointments
        services.AddTransient<IViewAppointmentsAllUseCase, ViewAppointmentsAllUseCase>();
        services.AddTransient<IViewAppointmentsUseCase, ViewAppointmentsUseCase>();
        services.AddTransient<IViewAppointmentByIdUseCase, ViewAppointmentByIdUseCase>();
        services.AddTransient<IAddAppointmentUseCase, AddAppointmentUseCase>();
        services.AddTransient<IEditAppointmentUseCase, EditAppointmentUseCase>();
        services.AddTransient<IDeleteAppointmentUseCase, DeleteAppointmentUseCase>();
        services.AddScoped<IAppointmentService, AppointmentService>();

        return services;
    }

    public static IServiceCollection AddAppServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // AppSettings
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
        configuration.Bind(appSettings);
        appSettings.AssetsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icons") + Path.DirectorySeparatorChar;
        services.AddSingleton(appSettings);

        // FileHandling
        services.AddSingleton<IFileHandlingService, FileHandlingService>();

        // Email settings
        var emailConfig = configuration
            .GetSection("EmailConfiguration")
            .Get<EmailConfiguration>();
        services.AddSingleton(emailConfig ?? throw new Exception("Missing email configuration"));
        services.AddScoped<IEmailSender, EmailSender>();
        services.AddScoped<ICredentialsEmailService, CredentialsEmailService>();

        var maxUploadBytes = configuration.GetValue<long?>("FileUpload:MaxBytes") ?? 10L * 1024 * 1024;
        services.Configure<FormOptions>(o =>
        {
            o.ValueLengthLimit = (int)Math.Min(maxUploadBytes, int.MaxValue);
            o.MultipartBodyLengthLimit = maxUploadBytes;
        });

        services.AddControllers(options =>
            {
                options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
            })
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            });

        services.AddEndpointsApiExplorer();
        services.AddSwaggerDocumentation();

        // Reference-data caching (B7/#14): in-process IMemoryCache with configurable TTL.
        services.AddMemoryCache();
        services.Configure<FloorballTraining.API.Caching.CacheSettings>(
            configuration.GetSection("CacheSettings"));
        services.AddSingleton<FloorballTraining.API.Caching.IReferenceCache,
            FloorballTraining.API.Caching.ReferenceCache>();

        // FluentValidation - auto-validates DTOs into ModelState, which the
        // InvalidModelStateResponseFactory below turns into ApiValidationErrorResponse.
        // Rule-level Stop: report only the first failure per property (e.g. empty email
        // shows "povinný" instead of also "neplatný formát").
        ValidatorOptions.Global.DefaultRuleLevelCascadeMode = CascadeMode.Stop;
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<Program>();

        // AutoMapper
        services.AddAutoMapper(typeof(Program).Assembly, typeof(FloorballTraining.UseCases.Helpers.MappingProfiles).Assembly);

        // Validation error collecting
        services.Configure<ApiBehaviorOptions>(options => options.InvalidModelStateResponseFactory = actionContext =>
        {
            var errors = actionContext.ModelState.Where(e => e.Value?.Errors.Count > 0 && e.Value?.Errors != null).SelectMany(x => x.Value?.Errors!)
                .Select(x => x.ErrorMessage).ToArray();

            var errorResponse = new ApiValidationErrorResponse()
            {
                Errors = errors
            };

            return new BadRequestObjectResult(errorResponse);
        });

        return services;
    }

    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "FloorballTraining API",
                Version = "v1",
                Description = "REST API pro FloTr (správa tréninků, aktivit, týmů a klubů)."
            });

            // JWT Bearer support: shows the "Authorize" button in Swagger UI so protected
            // endpoints can be tested with a token obtained from /auth/login.
            var jwtScheme = new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Vlož JWT token (bez prefixu 'Bearer ').",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            };
            options.AddSecurityDefinition("Bearer", jwtScheme);
            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                { jwtScheme, Array.Empty<string>() }
            });

            // Surface the XML doc comments emitted via GenerateDocumentationFile.
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }
        });

        return services;
    }

    public static IServiceCollection AddBackgroundJobs(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddHangfire(config =>
        {
            config
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings();

            if (environment.IsProduction())
            {
                config.UseSqlServerStorage(
                    configuration.GetConnectionString("FloorballTraining"),
                    new SqlServerStorageOptions
                    {
                        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
                        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
                        QueuePollInterval = TimeSpan.Zero,
                        UseRecommendedIsolationLevel = true,
                        DisableGlobalLocks = true
                    });
            }
            else
            {
                // Development / test: no SQL Server required.
                config.UseInMemoryStorage();
            }
        });

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 2;
        });

        services.AddScoped<AuditLogRetentionJob>();
        services.AddScoped<AiUsageRetentionJob>();

        return services;
    }

    public const string CorsPolicyName = "CorsPolicy";

    public static IServiceCollection AddCorsPolicy(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        // Development origins: FloTr SPA (3000) and Blazor WebApp dev ports.
        var developmentOrigins = new[]
        {
            "http://localhost:3000",
            "https://localhost:3000",
            "https://localhost:7133",
            "http://localhost:5192"
        };

        // Production origins are configured via ALLOWED_ORIGINS (set by deploy.yml).
        var configuredOrigins = configuration.GetSection("ALLOWED_ORIGINS").Get<string[]>() ?? Array.Empty<string>();

        services.AddCors(o =>
        {
            o.AddPolicy(CorsPolicyName, policy =>
            {
                var origins = environment.IsDevelopment()
                    ? developmentOrigins.Concat(configuredOrigins).Distinct().ToArray()
                    : configuredOrigins;

                policy
                    .WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }
}
