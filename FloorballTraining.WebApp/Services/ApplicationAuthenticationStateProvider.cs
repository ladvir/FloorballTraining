using System.Security.Claims;
using FloorballTraining.CoreBusiness;
using Microsoft.AspNetCore.Components.Authorization;

namespace FloorballTraining.WebApp.Services
{
    public class ApplicationAuthenticationStateProvider(SecurityService securityService, ApplicationAuthenticationState? authenticationState) : AuthenticationStateProvider
    {
        public override async Task<AuthenticationState> GetAuthenticationStateAsync()
        {
            var identity = new ClaimsIdentity();

            try
            {
                var state = await GetApplicationAuthenticationStateAsync();

                if (state is { IsAuthenticated: true })
                {
                    identity = new ClaimsIdentity(state.Claims.Select(c => new Claim(c.Type, c.Value)), "FloorballTraining.WebApp");
                }
            }
            catch (HttpRequestException ex)
            {
            }

            var result = new AuthenticationState(new ClaimsPrincipal(identity));

            await securityService.InitializeAsync(result);

            return result;
        }

        private async Task<ApplicationAuthenticationState?> GetApplicationAuthenticationStateAsync()
        {
            authenticationState = await securityService.GetAuthenticationStateAsync();
            return authenticationState;
        }
    }
}