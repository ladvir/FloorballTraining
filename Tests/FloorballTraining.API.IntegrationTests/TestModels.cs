using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>Minimal shape of the API's AuthResponse needed by the tests.</summary>
public class AuthResponseModel
{
    public string AccessToken { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
}

public static class LoginHelper
{
    public static async Task<string> GetAdminTokenAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/Auth/login",
            new { Email = "admin@flotr.cz", Password = "Admin123!" });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AuthResponseModel>();
        return body!.AccessToken;
    }
}
