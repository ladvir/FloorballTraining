using System.Text.Json.Serialization;
using FloorballTraining.API.Errors;
using FloorballTraining.API.Middlewares;
using FloorballTraining.CoreBusiness;
//using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Services;
using FloorballTraining.Services.EmailService;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.AgeGroups;
using FloorballTraining.UseCases.Equipments;
using FloorballTraining.UseCases.Places;
using FloorballTraining.UseCases.Places.Implementations;
using FloorballTraining.UseCases.Places.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Tags;
using FloorballTraining.UseCases.Trainings;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

//Generic repository
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericEFCoreRepository<>));


//Repositories
if (builder.Environment.IsEnvironment("TEST"))
{
    //StaticWebAssetsLoader.UseStaticWebAssets(builder.Environment, builder.Configuration);

    //builder.Services.AddSingleton<IActivityRepository, ActivityRepository>();
    //builder.Services.AddSingleton<ITagRepository, TagRepository>();
    //builder.Services.AddSingleton<IEquipmentRepository, EquipmentRepository>();
    //builder.Services.AddSingleton<ITrainingRepository, TrainingRepository>();
    //builder.Services.AddSingleton<IAgeGroupRepository, AgeGroupRepository>();
}
else
{
    builder.Services.AddScoped<IActivityRepository, ActivityEfCoreRepository>();
    builder.Services.AddScoped<ITagRepository, TagEFCoreRepository>();
    builder.Services.AddScoped<IEquipmentRepository, EquipmentEFCoreRepository>();
    builder.Services.AddScoped<ITrainingRepository, TrainingEfCoreRepository>();
    builder.Services.AddScoped<IAgeGroupRepository, AgeGroupEFCoreRepository>();
    builder.Services.AddScoped<IPlaceRepository, PlaceEFCoreRepository>();
}




// Add services to the container.
//Trainings
builder.Services.AddTransient<IViewTrainingByNameUseCase, ViewTrainingByNameUseCase>();
builder.Services.AddTransient<IViewTrainingByCriteriaUseCase, ViewTrainingByCriteriaUseCase>();
builder.Services.AddTransient<IViewTrainingByIdUseCase, ViewTrainingByIdUseCase>();
builder.Services.AddTransient<IAddTrainingUseCase, AddTrainingUseCase>();
builder.Services.AddTransient<IEditTrainingUseCase, EditTrainingUseCase>();
builder.Services.AddTransient<IViewTrainingEquipmentUseCase, ViewTrainingEquipmentUseCase>();
builder.Services.AddTransient<ICreateTrainingPdfUseCase, CreateTrainingPdfUseCase>();
builder.Services.AddTransient<ISendTrainingViaEmailUseCase, SendTrainingViaEmailUseCase>();


//Activities


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
builder.Services.AddTransient<ISendActivityViaEmailUseCase, SendActivityViaEmailUseCase>();



//Tags
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

builder.Services.AddTransient<IViewAgeGroupByNameUseCase, ViewAgeGroupByNameUseCase>();


//Validators
/*builder.Services.AddValidatorsFromAssemblyContaining<TrainingValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<TrainingPartValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<ActivityValidator>();
*/

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

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });



builder.Services.AddControllers();



// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


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
//if (app.Environment.IsDevelopment())
//{
app.UseSwagger();
app.UseSwaggerUI();
//}



app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();
