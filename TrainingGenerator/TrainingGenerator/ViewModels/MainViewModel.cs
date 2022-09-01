﻿using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class MainViewModel : ViewModelBase
    {
        private readonly NavigationStore _navigationStore;
        public ViewModelBase CurrentViewModel => _navigationStore.CurrentModelView;

        public ICommand DashboardMenuCommand { get; }

        public ICommand TrainingMenuCommand { get; }

        public ICommand ActivityMenuCommand { get; }

        public ICommand SettingsMenuCommand { get; }

        public MainViewModel(
            NavigationStore navigationStore,
            NavigationService<TrainingListingViewModel> trainingNavigationService,
            NavigationService<ActivityListingViewModel> activityListingNavigationService,
            NavigationService<SettingsViewModel> settingsNavigationService)
        {
            _navigationStore = navigationStore;
            _navigationStore.CurrentViewModelChanged += OnCurrentModelViewChanged;

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