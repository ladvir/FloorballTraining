using System.Diagnostics;
using System.Net;
using System.Text.Json;
using FloorballTraining.API.Errors;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Middlewares
{
    public class ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IHostEnvironment environment)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (DbUpdateConcurrencyException)
            {
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                var json = JsonSerializer.Serialize(
                    new ApiResponse(409, "Záznam byl mezitím upraven jiným uživatelem. Načtěte aktuální verzi a opakujte změny."),
                    options);
                await context.Response.WriteAsync(json);
            }
            catch (Exception ex)
            {
                var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

                logger.LogError(ex, "Unhandled exception. TraceId: {TraceId}", traceId);

                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

                // Full detail is exposed only in development or to authenticated admins.
                // In production, non-admin clients receive a generic message plus a
                // traceId they can quote to support for server-side lookup.
                var exposeDetails = environment.IsDevelopment() || context.User.IsInRole("Admin");

                var response = exposeDetails
                    ? new ApiException((int)HttpStatusCode.InternalServerError, ex.Message, ex.StackTrace, traceId)
                    : new ApiException((int)HttpStatusCode.InternalServerError,
                        "Došlo k chybě, kontaktujte podporu a uveďte identifikátor chyby.", null, traceId);

                var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                var json = JsonSerializer.Serialize(response, options);

                await context.Response.WriteAsync(json);
            }
        }
    }
}
