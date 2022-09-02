using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
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
        private readonly PdfCreationService _pdfCreationService;
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


        private ICommand _removeSelectedTraining;

        public ICommand RemoveSelectedTrainingCommand
        {
            get { return _removeSelectedTraining ??= new RelayCommand(x => { RemoveSelectedTraining((TrainingViewModel)x); }); }
        }

        private async void RemoveSelectedTraining(TrainingViewModel trainingViewModel)
        {
            await _teamStore.DeleteTraining(trainingViewModel.Training);

            _trainings.Remove(trainingViewModel);

        }



        private ICommand _createPDFForTrainingCommand;

        public ICommand CreatePDFForTrainingCommand {
            get { return _createPDFForTrainingCommand ??= new RelayCommand(x => { CreatePDFForTraining((TrainingViewModel)x); }); }
        }

        private async void CreatePDFForTraining(TrainingViewModel x)
        {
            var training = await _teamStore.GetTraining(x.Training.TrainingId);


            string pdfFileName =  _pdfCreationService.CreatePdf(training);
        }

        public TrainingListingViewModel(
            TeamStore teamStore,
            NavigationService<AddTrainingViewModel> addTrainingNavigationService, 
            PdfCreationService pdfCreationService

        )
        {
            _trainings = new ObservableCollection<TrainingViewModel>();
            OpenNewTrainingWindowCommand = new NavigateCommand<AddTrainingViewModel>(addTrainingNavigationService);
            //OpenTrainingCommand = new NavigateCommand<TrainingDetailViewModel>(trainingDetailNavigationService);
            LoadTrainingCommand = new LoadTrainingCommand(teamStore, this);
            _teamStore = teamStore;
            _pdfCreationService = pdfCreationService;
        }

        public static TrainingListingViewModel LoadViewModel(
            TeamStore teamStore,            
            NavigationService<AddTrainingViewModel> addTrainingNavigationService,
            PdfCreationService pdfCreationService
            )
        {
            var viewModel = new TrainingListingViewModel(teamStore,  addTrainingNavigationService, pdfCreationService);

            _ = viewModel._teamStore.LoadActivities();
            viewModel.LoadTrainingCommand.Execute(null);

            return viewModel;
        }

        public void ListTrainings(IEnumerable<Training> trainings)
        {
            _trainings.Clear();

            //todo

            foreach (var training in trainings)
            {
                TrainingViewModel trainingViewModel = new TrainingViewModel(training);

                _trainings.Add(trainingViewModel);
            }
        }
    }
}