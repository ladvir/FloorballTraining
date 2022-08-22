using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows.Controls;
using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class DashboardViewModel : ViewModelBase
    {
        private ObservableCollection<ActivityViewModel> _activities;
        private readonly TeamStore _teamStore;
        public IEnumerable<ActivityViewModel> Activities => _activities;

        public ListView ActivitiesListView;

        private ActivityViewModel _selectedActivity;

        public ActivityViewModel SelectedActivity
        {
            get { return _selectedActivity; }
            set
            {
                _selectedActivity = value;
                _teamStore.SelectedActivity = _selectedActivity.Activity;

                OnPropertyChanged(nameof(SelectedActivity));
            }
        }

        private bool _isLoading;

        public bool IsLoading
        {
            get => _isLoading;

            set
            {
                _isLoading = value;
                OnPropertyChanged(nameof(IsLoading));
            }
        }

        private string _errorMessage;

        public string ErrorMessage
        {
            get => _errorMessage;

            set
            {
                _errorMessage = value;

                OnPropertyChanged(nameof(ErrorMessage));
                OnPropertyChanged(nameof(HasErrorMessage));
            }
        }

        public bool HasErrorMessage => !string.IsNullOrEmpty(ErrorMessage);

        public ICommand AddActivityCommand { get; }
        public ICommand LoadActivityCommand { get; }

        public ICommand OpenActivityCommand { get; }

        public DashboardViewModel(
            TeamStore teamStore,
            NavigationService<ActivityListingViewModel> activityListingNavigationService
        )
        {
            _activities = new ObservableCollection<ActivityViewModel>();
            AddActivityCommand = new NavigateCommand<ActivityListingViewModel>(activityListingNavigationService);

            //LoadActivityCommand = new LoadActivityCommand(teamStore, this);
            _teamStore = teamStore;
        }

        public static DashboardViewModel LoadViewModel(
            TeamStore teamStore,
            NavigationService<ActivityListingViewModel> activityListingNavigationService
            )
        {
            var viewModel = new DashboardViewModel(teamStore, activityListingNavigationService);

            //viewModel.LoadActivityCommand.Execute(null);

            return viewModel;
        }

        public void ListActivities(IEnumerable<Activity> activities)
        {
            _activities.Clear();

            foreach (var activity in activities)
            {
                ActivityViewModel activityViewModel = new ActivityViewModel(activity);

                _activities.Add(activityViewModel);
            }
        }
    }
}