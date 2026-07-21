using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>Minimal shape of the API's AuthResponse needed by the tests.</summary>
public class AuthResponseModel
{
    public string AccessToken { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public string AccountType { get; set; } = string.Empty;
}

public static class LoginHelper
{
    public static Task<string> GetAdminTokenAsync(HttpClient client)
        => GetTokenAsync(client, "admin@flotr.cz", "Admin123!");

    public static async Task<string> GetTokenAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/Auth/login",
            new { Email = email, Password = password });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AuthResponseModel>();
        return body!.AccessToken;
    }
}
