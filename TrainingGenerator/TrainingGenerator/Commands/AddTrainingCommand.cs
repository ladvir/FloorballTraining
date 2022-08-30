using System;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Xml.Linq;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Commands
{
    public class AddTrainingCommand : AsyncCommandBase
    {
        private readonly AddTrainingViewModel _addTrainingViewModel;
        private readonly NavigationService<TrainingListingViewModel> _TrainingListingNavigationService;
        private readonly TeamStore _teamStore;

        public AddTrainingCommand(TeamStore teamStore, AddTrainingViewModel addTrainingViewModel, NavigationService<TrainingListingViewModel> TrainingListingNavigationService)
        {
            _addTrainingViewModel = addTrainingViewModel;
            _TrainingListingNavigationService = TrainingListingNavigationService;
            _teamStore = teamStore;

            _addTrainingViewModel.PropertyChanged += OnViewModelPropertyChanged;
        }

        private void OnViewModelPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(AddTrainingViewModel.CanSave))
            {
                OnCanExecutedChanged();
            }
        }

        public override bool CanExecute(object parameter)
        {
            return _addTrainingViewModel.CanSave && base.CanExecute(parameter);
        }

        public override async Task ExecuteAsync(object parameter)
        {
            _addTrainingViewModel.SubmitErrorMessage = string.Empty;
            _addTrainingViewModel.IsSubmitting = true;

            _addTrainingViewModel.Duration = 60;
            _addTrainingViewModel.Name = "Fake";

            if (!_addTrainingViewModel.TrainingActivities.Any())
            {
                _addTrainingViewModel.GetRandomActivities(_addTrainingViewModel.Duration);
            }
            var training = new Training
            {
                Name = _addTrainingViewModel.Name,
                Duration = _addTrainingViewModel.Duration,
                PersonsMin = _addTrainingViewModel.PersonsMin,
                PersonsMax = _addTrainingViewModel.PersonsMax,
                FlorbalPercent = _addTrainingViewModel.FlorbalPercent,
                PrefferedAktivityRatioMin = _addTrainingViewModel.PrefferedAktivityRatioMin,
                Note = _addTrainingViewModel.Note,
                BeginTimeMax = _addTrainingViewModel.BeginTimeMax,
                WarmUpTimeMax = _addTrainingViewModel.WarmUpTimeMax,
                WarmUpExcerciseTimeMax = _addTrainingViewModel.WarmUpExcerciseTimeMax,
                DrilTimeMax = _addTrainingViewModel.DrilTimeMax,
                StretchingTimeMax = _addTrainingViewModel.StretchingTimeMax,
                EndTimeMax = _addTrainingViewModel.EndTimeMax,
                BlockPauseTimeMax = _addTrainingViewModel.BlockPauseTimeMax,
                ActivityPauseTimeMax = _addTrainingViewModel.ActivityPauseTimeMax,
                TrainingActivities = _addTrainingViewModel.TrainingActivities
            };

            try
            {
                await _teamStore.AddTraining(training);

                _TrainingListingNavigationService.Navigate();
            }
            catch (Exception e)
            {
                MessageBox.Show($"Chyba při ukládání nového tréninku - {e.Message} - {e.InnerException?.Message}", "Chyba", MessageBoxButton.OK, MessageBoxImage.Error);
            }

            _addTrainingViewModel.IsSubmitting = false;
        }
    }
}