using System.Security.Claims;
using FloorballTraining.Identity.Models;
using Microsoft.AspNetCore.Components.Authorization;

namespace FloorballTraining.Identity.Services
{
    public class ApplicationAuthenticationStateProvider(SecurityService securityService, ApplicationAuthenticationState authenticationState) : AuthenticationStateProvider
    {
        public override async Task<AuthenticationState> GetAuthenticationStateAsync()
        {
            var identity = new ClaimsIdentity();

            try
            {
                var state = await GetApplicationAuthenticationStateAsync();

                if (state.IsAuthenticated)
                {
                    identity = new ClaimsIdentity(state.Claims.Select(c => new Claim(c.Type, c.Value)), "FloorballTraining.Identity");
                }
            }
            catch (HttpRequestException ex)
            {
            }

            var result = new AuthenticationState(new ClaimsPrincipal(identity));

            await securityService.InitializeAsync(result);

            return result;
        }

        private async Task<ApplicationAuthenticationState> GetApplicationAuthenticationStateAsync()
        {
            return authenticationState ??= await securityService.GetAuthenticationStateAsync();
        }
    }
}