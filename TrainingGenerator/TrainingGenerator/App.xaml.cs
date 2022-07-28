using Microsoft.EntityFrameworkCore;
using System.Windows;
using TrainingGenerator.DbContexts;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Services.ActivityCreators;
using TrainingGenerator.Services.ActivityProviders;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        private const string ConnectionString = "Data Source=training.db";

        private readonly TrainingDbContextFactory _trainingDbContextFactory;
        private readonly NavigationStore _navigationStore;
        private readonly TeamStore _teamStore;

        private readonly NavigationService _navigationService;

        private Team _team;

        public App()
        {
            _trainingDbContextFactory = new TrainingDbContextFactory(ConnectionString);

            IActivityProvider activityProvider = new DatabaseActivityProvider(_trainingDbContextFactory);
            IActivityCreator activityCreator = new DatabaseActivityCreator(_trainingDbContextFactory);

            _team = new Team(activityProvider, activityCreator);

            _navigationStore = new NavigationStore();

            _navigationService = new NavigationService(_navigationStore, CreateAddActivityViewModel);
            _teamStore = new TeamStore(_team);
        }

        protected override void OnStartup(StartupEventArgs e)
        {
            _navigationStore.CurrentModelView = new ActivityListingViewModel(_teamStore, _navigationService);

            using (var trainingDbContext = _trainingDbContextFactory.CreateDbContext())
            {
                trainingDbContext.Database.Migrate();
            }

            _navigationStore.CurrentModelView = CreateActivityListingViewModel();

            MainWindow mainWindow = new MainWindow()
            {
                DataContext = new MainViewModel(_navigationStore)
            };

            mainWindow.Show();

            base.OnStartup(e);
        }

        private AddActivityViewModel CreateAddActivityViewModel()
        {
            return new AddActivityViewModel(_teamStore, new NavigationService(_navigationStore, CreateActivityListingViewModel));
        }

        private ActivityListingViewModel CreateActivityListingViewModel()
        {
            return ActivityListingViewModel.LoadViewModel(_teamStore, new NavigationService(_navigationStore, CreateAddActivityViewModel));
        }
    }
}