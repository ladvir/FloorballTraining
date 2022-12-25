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

            if (!_addTrainingViewModel.TrainingActivities.Any())
            {
                _addTrainingViewModel.GetRandomActivities();
            }
            var training = new Training
            {
                Name = _addTrainingViewModel.Name,
                Duration = _addTrainingViewModel.Duration,
                PersonsMax = _addTrainingViewModel.PersonsMax,
                FlorbalPercent = _addTrainingViewModel.FlorbalPercent,
                Note = _addTrainingViewModel.Note,
                BeginTimeMax = _addTrainingViewModel.BeginTimeMax,
                WarmUpTimeMax = _addTrainingViewModel.WarmUpTimeMax,
                WarmUpExcerciseTimeMax = _addTrainingViewModel.WarmUpExcerciseTimeMax,
                DrilTimeMax = _addTrainingViewModel.DrilTimeMax,
                StretchingTimeMax = _addTrainingViewModel.StretchingTimeMax,
                EndTimeMax = _addTrainingViewModel.EndTimeMax,
                BlockPauseTimeMax = _addTrainingViewModel.BlockPauseTimeMax,
                ActivityPauseTimeMax = _addTrainingViewModel.ActivityPauseTimeMax,
                TrainingActivities = _addTrainingViewModel.TrainingActivities,

                IsGameSituation1x1 = _addTrainingViewModel.IsGameSituation1x1,
                IsGameSituation2x2 = _addTrainingViewModel.IsGameSituation2x2,
                IsGameSituation3x3 = _addTrainingViewModel.IsGameSituation3x3,
                IsGameSituation4x4 = _addTrainingViewModel.IsGameSituation4x4,
                IsGameSituation5x5 = _addTrainingViewModel.IsGameSituation5x5,
                IsGameSituation2x3 = _addTrainingViewModel.IsGameSituation2x3,
                IsGameSituation2x1 = _addTrainingViewModel.IsGameSituation2x1,
                IsForGoalman = _addTrainingViewModel.IsForGoalman,
                IsForForward = _addTrainingViewModel.IsForForward,
                IsForDefender = _addTrainingViewModel.IsForDefender,
                IsTrainingPartWarmUp = _addTrainingViewModel.IsTrainingPartWarmUp,
                IsTrainingWarmUpExcercise = _addTrainingViewModel.IsTrainingWarmUpExcercise,
                IsTrainingPartDril = _addTrainingViewModel.IsTrainingPartDril,
                IsTrainingPartStretching = _addTrainingViewModel.IsTrainingPartStretching,
                IsGame = _addTrainingViewModel.IsGame,
                IsFlorbal = _addTrainingViewModel.IsFlorbal,
                IsTest = _addTrainingViewModel.IsTest,
                IsRelay = _addTrainingViewModel.IsRelay,
                IsShooting = _addTrainingViewModel.IsShooting,
                IsPass = _addTrainingViewModel.IsPass,
                IsBallLeading = _addTrainingViewModel.IsBallLeading,
                IsFlexibility = _addTrainingViewModel.IsFlexibility,
                IsStrength = _addTrainingViewModel.IsStrength,
                IsDynamic = _addTrainingViewModel.IsDynamic,
                IsReleasing = _addTrainingViewModel.IsReleasing,
                IsSpeed = _addTrainingViewModel.IsSpeed,
                IsPersistence = _addTrainingViewModel.IsPersistence,
                IsThinking = _addTrainingViewModel.IsThinking,
                IsTeamWork = _addTrainingViewModel.IsTeamWork,
                IsFlorballBallsNeeded = _addTrainingViewModel.IsFlorballBallsNeeded,
                IsFlorballGateNeeded = _addTrainingViewModel.IsFlorballGateNeeded,
                IsResulutionDressNeeded = _addTrainingViewModel.IsResulutionDressNeeded,
                IsConeNeeded = _addTrainingViewModel.IsConeNeeded,
                IsHurdleNeeded = _addTrainingViewModel.IsHurdleNeeded,
                IsJumpingLadderNeeded = _addTrainingViewModel.IsJumpingLadderNeeded,
                IsJumpingRopeNeeded = _addTrainingViewModel.IsJumpingRopeNeeded,
                IsFootballBallNeeded = _addTrainingViewModel.IsFootballBallNeeded,
                IsCathegoryU7 = _addTrainingViewModel.IsCathegoryU7,
                IsCathegoryU9 = _addTrainingViewModel.IsCathegoryU9,
                IsCathegoryU11 = _addTrainingViewModel.IsCathegoryU11,
                IsCathegoryU13 = _addTrainingViewModel.IsCathegoryU13,
                IsCathegoryU15 = _addTrainingViewModel.IsCathegoryU15,
                IsCathegoryU17 = _addTrainingViewModel.IsCathegoryU17,
                IsCathegoryU21 = _addTrainingViewModel.IsCathegoryU21,
                IsCathegoryAdult = _addTrainingViewModel.IsCathegoryAdult

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