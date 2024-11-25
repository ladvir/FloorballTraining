using System.Security.Claims;
using System.Text;
using System.Text.Json;
using FloorballTraining.CoreBusiness;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using Radzen;

namespace FloorballTraining.WebApp.Services
{
    public class SecurityService(NavigationManager navigationManager, IHttpClientFactory factory)
    {

        private readonly HttpClient _httpClient = factory.CreateClient("FloorballTraining.WebApp");

        private readonly Uri _baseUri = new($"{navigationManager.BaseUri}odata/WebApp/");

        public ApplicationUser User { get; private set; } = new ApplicationUser { Name = "Anonymous" };

        public ClaimsPrincipal? Principal { get; private set; }

        public bool IsInRole(params string[] roles)
        {
#if DEBUG
            if (User.Name == "admin")
            {
                return true;
            }
#endif

            if (roles.Contains("Everybody"))
            {
                return true;
            }

            if (!IsAuthenticated())
            {
                return false;
            }

            if (roles.Contains("Authenticated"))
            {
                return true;
            }

            return roles.Any(role => Principal != null && Principal.IsInRole(role));
        }

        public bool IsAuthenticated()
        {
            return Principal?.Identity?.IsAuthenticated == true;
        }

        public async Task<bool> InitializeAsync(AuthenticationState result)
        {
            Principal = result.User;
#if DEBUG
            if (Principal.Identity?.Name == "admin")
            {
                User = new ApplicationUser { Name = "Admin" };

                return true;
            }
#endif
            var userId = Principal?.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId != null && User.Id != userId)
            {
                User = await GetUserById(userId);
            }

            return IsAuthenticated();
        }


        public async Task<ApplicationAuthenticationState?> GetAuthenticationStateAsync()
        {
            var uri = new Uri($"{navigationManager.BaseUri}Account/CurrentUser");

            var response = await _httpClient.SendAsync(new HttpRequestMessage(HttpMethod.Post, uri));

            return await response.ReadAsync<ApplicationAuthenticationState>();
        }

        public void Logout()
        {
            navigationManager.NavigateTo("Account/Logout", true);
        }

        public void Login()
        {
            navigationManager.NavigateTo("Login", true);
        }

        public async Task<IEnumerable<ApplicationRole>> GetRoles()
        {
            var uri = new Uri(_baseUri, $"ApplicationRoles");

            uri = uri.GetODataUri();

            var response = await _httpClient.GetAsync(uri);

            var result = await response.ReadAsync<ODataServiceResult<ApplicationRole>>();

            return result.Value;
        }

        public async Task<ApplicationRole> CreateRole(ApplicationRole role)
        {
            var uri = new Uri(_baseUri, $"ApplicationRoles");

            var content = new StringContent(ODataJsonSerializer.Serialize(role), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(uri, content);

            return await response.ReadAsync<ApplicationRole>();
        }

        public async Task<HttpResponseMessage> DeleteRole(string id)
        {
            var uri = new Uri(_baseUri, $"ApplicationRoles('{id}')");

            return await _httpClient.DeleteAsync(uri);
        }

        public async Task<IEnumerable<ApplicationUser>> GetUsers()
        {
            var uri = new Uri(_baseUri, $"ApplicationUsers");


            uri = uri.GetODataUri();

            var response = await _httpClient.GetAsync(uri);

            var result = await response.ReadAsync<ODataServiceResult<ApplicationUser>>();

            return result.Value;
        }

        public async Task<ApplicationUser> CreateUser(ApplicationUser user)
        {
            var uri = new Uri(_baseUri, $"ApplicationUsers");

            var content = new StringContent(JsonSerializer.Serialize(user), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(uri, content);

            return await response.ReadAsync<ApplicationUser>();
        }

        public async Task<HttpResponseMessage> DeleteUser(string id)
        {
            var uri = new Uri(_baseUri, $"ApplicationUsers('{id}')");

            return await _httpClient.DeleteAsync(uri);
        }

        public async Task<ApplicationUser> GetUserById(string id)
        {
            var uri = new Uri(_baseUri, $"ApplicationUsers('{id}')?$expand=Roles");

            var response = await _httpClient.GetAsync(uri);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            return await response.ReadAsync<ApplicationUser>();
        }

        public async Task<ApplicationUser> UpdateUser(string id, ApplicationUser user)
        {
            var uri = new Uri(_baseUri, $"ApplicationUsers('{id}')");

            var httpRequestMessage = new HttpRequestMessage(HttpMethod.Patch, uri)
            {
                Content = new StringContent(JsonSerializer.Serialize(user), Encoding.UTF8, "application/json")
            };

            var response = await _httpClient.SendAsync(httpRequestMessage);

            return await response.ReadAsync<ApplicationUser>();
        }
        public async Task ChangePassword(string oldPassword, string newPassword)
        {
            var uri = new Uri($"{navigationManager.BaseUri}Account/ChangePassword");

            var content = new FormUrlEncodedContent(new Dictionary<string, string> {
                { "oldPassword", oldPassword },
                { "newPassword", newPassword }
            });

            var response = await _httpClient.PostAsync(uri, content);

            if (!response.IsSuccessStatusCode)
            {
                var message = await response.Content.ReadAsStringAsync();

                throw new ApplicationException(message);
            }
        }

        public async Task Register(string userName, string password)
        {
            var uri = new Uri($"{navigationManager.BaseUri}Account/Register");

            var content = new FormUrlEncodedContent(new Dictionary<string, string> {
                { "userName", userName },
                { "password", password }
            });

            var response = await _httpClient.PostAsync(uri, content);

            if (!response.IsSuccessStatusCode)
            {
                var message = await response.Content.ReadAsStringAsync();

                throw new ApplicationException(message);
            }
        }

        public async Task ResetPassword(string userName)
        {
            var uri = new Uri($"{navigationManager.BaseUri}Account/ResetPassword");

            var content = new FormUrlEncodedContent(new Dictionary<string, string> {
                { "userName", userName }
            });

            var response = await _httpClient.PostAsync(uri, content);

            if (!response.IsSuccessStatusCode)
            {
                var message = await response.Content.ReadAsStringAsync();

                throw new ApplicationException(message);
            }
        }
    }
}