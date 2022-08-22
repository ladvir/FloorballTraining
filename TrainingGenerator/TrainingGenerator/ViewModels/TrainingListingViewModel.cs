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
    public class TrainingListingViewModel : ViewModelBase
    {
        private readonly TeamStore _teamStore;

        private ObservableCollection<TrainingViewModel> _trainings;
        public IEnumerable<TrainingViewModel> Trainings => _trainings;

        private TrainingViewModel _selectedTraining;

        public TrainingViewModel SelectedActivity
        {
            get { return _selectedTraining; }
            set
            {
                _selectedTraining = value;
                _teamStore.SelectedTraining = _selectedTraining.Training;

                OnPropertyChanged(nameof(SelectedTraining));
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

        public ICommand OpenNewTrainingWindowCommand { get; set; }

        public ICommand LoadTrainingCommand { get; }
        public TrainingViewModel SelectedTraining { get; set; }
        public ICommand OpenTrainingCommand { get; set; }

        public TrainingListingViewModel(
            TeamStore teamStore,
            NavigationService<TrainingListingViewModel> trainingListingNavigationService

        )
        {
            _trainings = new ObservableCollection<TrainingViewModel>();
            //OpenNewTrainingWindowCommand = new NavigateCommand<AddTrainingViewModel>(addTrainingNavigationService);
            //OpenTrainingCommand = new NavigateCommand<TrainingDetailViewModel>(trainingDetailNavigationService);
            LoadTrainingCommand = new LoadTrainingCommand(teamStore, this);
            _teamStore = teamStore;
        }

        public static TrainingListingViewModel LoadViewModel(
            TeamStore teamStore,
            NavigationService<TrainingListingViewModel> trainingListingNavigationService
            )
        {
            var viewModel = new TrainingListingViewModel(teamStore, trainingListingNavigationService);

            viewModel.LoadTrainingCommand.Execute(null);

            return viewModel;
        }

        public void ListTrainings(IEnumerable<Training> trainings)
        {
            _trainings.Clear();

            foreach (var training in trainings)
            {
                TrainingViewModel trainingViewModel = new TrainingViewModel(training);

                _trainings.Add(trainingViewModel);
            }
        }
    }
}