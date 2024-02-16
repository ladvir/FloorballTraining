using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Services;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Trainings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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



var serviceProvider = new ServiceCollection()
            .AddDbContextFactory<FloorballTrainingContext>(options =>
            {
                options

                    .UseSqlServer(configuration.GetConnectionString("FloorballTraining"),
                        opt => opt.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery).UseRelationalNulls())
                    // .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
                    .EnableSensitiveDataLogging();
            })
            .AddSingleton<IConfiguration>(configuration)
            .AddSingleton<IFileHandlingService, FileHandlingService>()
            .AddScoped<IActivityRepository, ActivityEfCoreRepository>()
            .AddScoped<ITagRepository, TagEFCoreRepository>()
            .AddScoped<IEquipmentRepository, EquipmentEFCoreRepository>()
            .AddScoped<ITrainingRepository, TrainingEfCoreRepository>()
            .AddScoped<IAgeGroupRepository, AgeGroupEFCoreRepository>()
            .AddTransient<ICreateTrainingPdfUseCase, CreateTrainingPdfUseCase>()
            .AddTransient<ICreateActivityPdfUseCase, CreateActivityPdfUseCase>()
            .AddSingleton(appSettings)
            .BuildServiceProvider();



var activityRepository = serviceProvider.GetRequiredService<IActivityRepository>();
//var trainingRepository = serviceProvider.GetRequiredService<ITrainingRepository>();

// Use productService to query the database
var activities = await activityRepository.GetActivitiesByCriteriaAsync(new SearchCriteria { Ids = new List<int> { 1,2} });

//var training = await trainingRepository.GetTrainingByIdAsync(1);

var pdfCreator = serviceProvider.GetRequiredService<ICreateActivityPdfUseCase>();

await pdfCreator.ExecuteAsync(1, AppDomain.CurrentDomain.BaseDirectory);

