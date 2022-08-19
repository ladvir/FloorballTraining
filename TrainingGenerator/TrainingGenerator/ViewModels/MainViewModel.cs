using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class MainViewModel : ViewModelBase
    {
        private readonly NavigationStore _navigationStore;
        public ViewModelBase CurrentViewModel => _navigationStore.CurrentModelView;

        public ICommand DashboardMenuCommand;

        public ICommand TrainingMenuCommand;

        public ICommand ActivityMenuCommand;

        public ICommand SettingsMenuCommand;

        public MainViewModel(
            NavigationStore navigationStore,
            NavigationService<DashboardViewModel> dashboardNavigationService,
            NavigationService<TrainingListingViewModel> trainingNavigationService,
            NavigationService<ActivityListingViewModel> activityListingNavigationService,
            NavigationService<SettingsViewModel> settingsNavigationService)
        {
            _navigationStore = navigationStore;
            _navigationStore.CurrentViewModelChanged += OnCurrentModelViewChanged;

            DashboardMenuCommand = new NavigateCommand<DashboardViewModel>(dashboardNavigationService);
            TrainingMenuCommand = new NavigateCommand<TrainingListingViewModel>(trainingNavigationService);
            ActivityMenuCommand = new NavigateCommand<ActivityListingViewModel>(activityListingNavigationService);

            SettingsMenuCommand = new NavigateCommand<SettingsViewModel>(settingsNavigationService);
        }

        private void OnCurrentModelViewChanged()
        {
            OnPropertyChanged(nameof(CurrentViewModel));
        }
    }
}