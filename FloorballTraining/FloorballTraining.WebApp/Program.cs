using FloorballTraining.Plugins.InMemory;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Tags;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();
builder.Services.AddMudServices();


//Activities
builder.Services.AddSingleton<IActivityRepository, ActivityRepository>();
builder.Services.AddTransient<IViewActivityByNameUseCase, ViewActivityByNameUseCase>();
builder.Services.AddTransient<IViewActivityByIdUseCase, ViewActivityByIdUseCase>();
builder.Services.AddTransient<IAddActivityUseCase, AddActivityUseCase>();
builder.Services.AddTransient<IEditActivityUseCase, EditActivityUseCase>();

//Tags
builder.Services.AddSingleton<ITagRepository, TagRepository>();
builder.Services.AddTransient<IViewTagByNameUseCase, ViewTagByNameUseCase>();
builder.Services.AddTransient<IViewTagByParentTagIdUseCase, ViewTagByParentTagIdUseCase>();
builder.Services.AddTransient<IAddTagUseCase, AddTagUseCase>();

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
