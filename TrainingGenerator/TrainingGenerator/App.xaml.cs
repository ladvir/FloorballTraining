using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Windows;
using TrainingGenerator.DbContexts;
using TrainingGenerator.HostBuilders;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Services.AcitivityDeletors;
using TrainingGenerator.Services.ActivityCreators;
using TrainingGenerator.Services.ActivityProviders;
using TrainingGenerator.Services.ActivityUpdators;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        private readonly IHost _host;

        public App()
        {
            _host = Host.CreateDefaultBuilder()
            .AddViewModels()
            .ConfigureServices((hostContext, services) =>
              {
                  string connectionString = hostContext.Configuration.GetConnectionString("Default");

                  services.AddSingleton(new TrainingDbContextFactory(connectionString));
                  services.AddSingleton<IActivityProvider, DatabaseActivityProvider>();
                  services.AddSingleton<IActivityCreator, DatabaseActivityCreator>();
                  services.AddSingleton<IActivityUpdator, DatabaseActivityUpdator>();
                  services.AddSingleton<IActivityDeletor, DatabaseActivityDeletor>();

                  services.AddSingleton((s) => new Team(
                        s.GetRequiredService<IActivityProvider>(),
                        s.GetRequiredService<IActivityCreator>(),
                        s.GetRequiredService<IActivityUpdator>(),
                        s.GetRequiredService<IActivityDeletor>())

                       );

                  services.AddSingleton<NavigationService<ActivityListingViewModel>>();
                  services.AddSingleton<NavigationService<AddActivityViewModel>>();
                  services.AddSingleton<NavigationService<ActivityDetailViewModel>>();

                  services.AddSingleton<NavigationStore>();
                  services.AddSingleton<TeamStore>();

                  services.AddSingleton((s) => new MainWindow
                  {
                      DataContext = s.GetRequiredService<MainViewModel>()
                  }
                  );
              }
              ).Build();
        }

        protected override void OnStartup(StartupEventArgs e)
        {
            _host.Start();

            var trainingDbContextFactory = _host.Services.GetRequiredService<TrainingDbContextFactory>();
            using (var trainingDbContext = trainingDbContextFactory.CreateDbContext())
            {
                trainingDbContext.Database.Migrate();
            }

            var navigationService = _host.Services.GetRequiredService<NavigationService<ActivityListingViewModel>>();
            navigationService.Navigate();

            MainWindow mainWindow = _host.Services.GetRequiredService<MainWindow>();
            mainWindow.Show();

            base.OnStartup(e);
        }

        protected override void OnExit(ExitEventArgs e)
        {
            _host.Dispose();
            base.OnExit(e);
        }
    }
}