using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class MainViewModel : ViewModelBase
    {
        private readonly NavigationStore _navigationStore;
        private readonly ModalNavigationStore _modalNavigationStore;

        public ViewModelBase CurrentViewModel => _navigationStore.CurrentViewModel;
        public ViewModelBase? CurrentModalViewModel => _modalNavigationStore.CurrentViewModel;

        public bool IsModalOpen => _modalNavigationStore.IsOpen;

        public ICommand DashboardMenuCommand { get; }

        public ICommand TrainingMenuCommand { get; }

        public ICommand ActivityMenuCommand { get; }

        public ICommand SettingsMenuCommand { get; }

        public MainViewModel(
            NavigationStore navigationStore,
            ModalNavigationStore modalNavigationStore,
            NavigationService<TrainingListingViewModel> trainingNavigationService,
            NavigationService<ActivityListingViewModel> activityListingNavigationService,
            NavigationService<SettingsViewModel> settingsNavigationService)
        {
            _navigationStore = navigationStore;
            _navigationStore.CurrentViewModelChanged += OnCurrentViewModelChanged;

            _modalNavigationStore = modalNavigationStore;
            _modalNavigationStore.CurrentViewModelChanged += OnCurrentModalViewModelChanged;

            TrainingMenuCommand = new NavigateCommand<TrainingListingViewModel>(trainingNavigationService);
            ActivityMenuCommand = new NavigateCommand<ActivityListingViewModel>(activityListingNavigationService);

            SettingsMenuCommand = new NavigateCommand<SettingsViewModel>(settingsNavigationService);
        }

        private void OnCurrentModalViewModelChanged()
        {
            OnPropertyChanged(nameof(CurrentModalViewModel));
            OnPropertyChanged(nameof(IsModalOpen));
        }

        private void OnCurrentViewModelChanged()
        {
            OnPropertyChanged(nameof(CurrentViewModel));
        }
    }
}