using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.HostBuilders
{
    public static class AddViewModelHostBuilderExtensions
    {
        public static IHostBuilder AddViewModels(this IHostBuilder hostBuilder)
        {
            hostBuilder.ConfigureServices(services =>
            {
                services.AddTransient<AddActivityViewModel>();
                services.AddSingleton<Func<AddActivityViewModel>>((s) => () => s.GetRequiredService<AddActivityViewModel>());

                services.AddTransient((s) => CreateActivityListingViewModel(s));
                services.AddSingleton<Func<ActivityListingViewModel>>((s) => () => s.GetRequiredService<ActivityListingViewModel>());

                services.AddSingleton<MainViewModel>();
            });

            return hostBuilder;
        }

        private static ActivityListingViewModel CreateActivityListingViewModel(IServiceProvider service)
        {
            return ActivityListingViewModel.LoadViewModel(
                service.GetRequiredService<TeamStore>(),
                service.GetRequiredService<NavigationService<AddActivityViewModel>>()
            );
        }
    }
}