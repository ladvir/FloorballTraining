using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;
using System.Windows;
using TrainingGenerator.DbContexts;
using TrainingGenerator.HostBuilders;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Services.AcitivityDeletors;
using TrainingGenerator.Services.TrainingServices;
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

                  services.AddDbContext<TrainingDbContext>(options => options.UseSqlite(connectionString).EnableSensitiveDataLogging(true).LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Information));

                  services.AddSingleton(new TrainingDbContextFactory(connectionString));
                  services.AddSingleton<IActivityService, DatabaseActivityService>();
                  services.AddSingleton<ITrainingService, DatabaseTrainingService>();

                  services.AddSingleton((s) => new Team(
                        s.GetRequiredService<IActivityService>(),
                        s.GetRequiredService<ITrainingService>())

                       );

                  services.AddSingleton<NavigationService<ActivityListingViewModel>>();
                  services.AddSingleton<NavigationService<AddActivityViewModel>>();
                  services.AddSingleton<NavigationService<ActivityDetailViewModel>>();
                  services.AddSingleton<NavigationService<TrainingListingViewModel>>();
                  services.AddSingleton<NavigationService<AddTrainingViewModel>>();

                  services.AddSingleton<NavigationService<SettingsViewModel>>();

                  services.AddSingleton<NavigationStore>();
                  services.AddSingleton<TeamStore>();

                  services.AddSingleton((s) => new MainWindow()
                  {
                      DataContext = s.GetRequiredService<MainViewModel>()
                  }
                  );
              }

              )
              .Build();
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