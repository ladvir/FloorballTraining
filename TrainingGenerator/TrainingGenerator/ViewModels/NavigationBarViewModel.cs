using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Services;

namespace TrainingGenerator.ViewModels
{
    public class NavigationBarViewModel : ViewModelBase
    {
        public ICommand DashboardMenuCommand;

        public ICommand TrainingMenuCommand;

        public ICommand ActivityMenuCommand;

        public ICommand SettingsMenuCommand;

        public NavigationBarViewModel(
            NavigationService<DashboardViewModel> dashboardNavigationService,
            NavigationService<TrainingListingViewModel> trainingNavigationService,
            NavigationService<ActivityListingViewModel> activityListingNavigationService,
            NavigationService<SettingsViewModel> settingsNavigationService)
        {
            DashboardMenuCommand = new NavigateCommand<DashboardViewModel>(dashboardNavigationService);
            TrainingMenuCommand = new NavigateCommand<TrainingListingViewModel>(trainingNavigationService);
            ActivityMenuCommand = new NavigateCommand<ActivityListingViewModel>(activityListingNavigationService);
            SettingsMenuCommand = new NavigateCommand<SettingsViewModel>(settingsNavigationService);
        }
    }
}