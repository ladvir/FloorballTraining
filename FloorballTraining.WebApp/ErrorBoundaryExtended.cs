using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace FloorballTraining.WebApp;

public class ErrorBoundaryExtended : ErrorBoundary
{
    [Inject]
    private IWebHostEnvironment Environment { get; set; } = null!;

    protected override Task OnErrorAsync(Exception exception)
    {
        return Environment.IsProduction()
            ? base.OnErrorAsync(exception)
            : Task.CompletedTask;
    }
}