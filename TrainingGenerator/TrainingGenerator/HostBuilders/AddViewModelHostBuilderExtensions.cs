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

                services.AddTransient((s) => CreateActivityDetailViewModel(s));
                services.AddSingleton<Func<ActivityDetailViewModel>>((s) => () => s.GetRequiredService<ActivityDetailViewModel>());

                services.AddTransient((s) => CreateActivityListingViewModel(s));
                services.AddSingleton<Func<ActivityListingViewModel>>((s) => () => s.GetRequiredService<ActivityListingViewModel>());

                services.AddTransient((s) => CreateDashboardViewModel(s));
                services.AddSingleton<Func<DashboardViewModel>>((s) => () => s.GetRequiredService<DashboardViewModel>());

                services.AddTransient((s) => CreateTrainingListingViewModel(s));
                services.AddSingleton<Func<TrainingListingViewModel>>((s) => () => s.GetRequiredService<TrainingListingViewModel>());

                services.AddTransient((s) => CreateSettingsViewModel(s));
                services.AddSingleton<Func<SettingsViewModel>>((s) => () => s.GetRequiredService<SettingsViewModel>());

                services.AddSingleton<MainViewModel>();
            });

            return hostBuilder;
        }

        private static SettingsViewModel CreateSettingsViewModel(IServiceProvider service)
        {
            return SettingsViewModel.LoadViewModel(
                service.GetRequiredService<TeamStore>());
        }

        private static DashboardViewModel CreateDashboardViewModel(IServiceProvider service)
        {
            return DashboardViewModel.LoadViewModel(
                service.GetRequiredService<TeamStore>(),
                ActivatorUtilities.GetServiceOrCreateInstance<NavigationService<ActivityListingViewModel>>(service));
        }

        private static TrainingListingViewModel CreateTrainingListingViewModel(IServiceProvider service)
        {
            return TrainingListingViewModel.LoadViewModel(
               service.GetRequiredService<TeamStore>(),
               ActivatorUtilities.GetServiceOrCreateInstance<NavigationService<TrainingListingViewModel>>(service));
        }

        private static ActivityDetailViewModel CreateActivityDetailViewModel(IServiceProvider service)
        {
            return ActivityDetailViewModel.LoadViewModel(
                service.GetRequiredService<TeamStore>(),
                ActivatorUtilities.GetServiceOrCreateInstance<NavigationService<ActivityListingViewModel>>(service)

            );
        }

        private static ActivityListingViewModel CreateActivityListingViewModel(IServiceProvider service)
        {
            return ActivityListingViewModel.LoadViewModel(
                service.GetRequiredService<TeamStore>(),
                service.GetRequiredService<NavigationService<AddActivityViewModel>>(),
                service.GetRequiredService<NavigationService<ActivityDetailViewModel>>()
            );
        }
    }
}