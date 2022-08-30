using System;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Windows;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;
using TrainingGenerator.ViewModels;

namespace TrainingGenerator.Commands
{
    public class AddActivityCommand : AsyncCommandBase
    {
        private readonly AddActivityViewModel _addActivityViewModel;
        private readonly NavigationService<ActivityListingViewModel> _activityListingNavigationService;
        private readonly TeamStore _teamStore;

        public AddActivityCommand(TeamStore teamStore, AddActivityViewModel addActivityViewModel, NavigationService<ActivityListingViewModel> activityListingNavigationService)
        {
            _addActivityViewModel = addActivityViewModel;
            _activityListingNavigationService = activityListingNavigationService;
            _teamStore = teamStore;

            _addActivityViewModel.PropertyChanged += OnViewModelPropertyChanged;
        }

        private void OnViewModelPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(AddActivityViewModel.CanCreateActivity))
            {
                OnCanExecutedChanged();
            }
        }

        public override bool CanExecute(object parameter)
        {
            return _addActivityViewModel.CanCreateActivity && base.CanExecute(parameter);
        }

        public override async Task ExecuteAsync(object parameter)
        {
            _addActivityViewModel.SubmitErrorMessage = string.Empty;
            _addActivityViewModel.IsSubmitting = true;
            var activity = new Activity
            {
                Name = _addActivityViewModel.Name,
                Description = _addActivityViewModel.Description,
                PersonsMin = _addActivityViewModel.PersonsMin,
                PersonsMax = _addActivityViewModel.PersonsMax,
                DurationMin = _addActivityViewModel.DurationMin,
                DurationMax = _addActivityViewModel.DurationMax,
                RatingSum = _addActivityViewModel.RatingSum,
                RatingCount = _addActivityViewModel.RatingCount,
                IsGameSituation1x1 = _addActivityViewModel.IsGameSituation1x1,
                IsGameSituation2x2 = _addActivityViewModel.IsGameSituation2x2,
                IsGameSituation3x3 = _addActivityViewModel.IsGameSituation3x3,
                IsGameSituation4x4 = _addActivityViewModel.IsGameSituation4x4,
                IsGameSituation5x5 = _addActivityViewModel.IsGameSituation5x5,
                IsGameSituation2x3 = _addActivityViewModel.IsGameSituation2x3,
                IsGameSituation2x1 = _addActivityViewModel.IsGameSituation2x1,
                IsForGoalman = _addActivityViewModel.IsForGoalman,
                IsForForward = _addActivityViewModel.IsForForward,
                IsForDefender = _addActivityViewModel.IsForDefender,
                IsTrainingPartWarmUp = _addActivityViewModel.IsTrainingPartWarmUp,
                IsTrainingWarmUpExcercise = _addActivityViewModel.IsTrainingWarmUpExcercise,
                IsTrainingPartDril = _addActivityViewModel.IsTrainingPartDril,
                IsTrainingPartStretching = _addActivityViewModel.IsTrainingPartStretching,
                IsGame = _addActivityViewModel.IsGame,
                IsFlorbal = _addActivityViewModel.IsFlorbal,
                IsTest = _addActivityViewModel.IsTest,
                IsRelay = _addActivityViewModel.IsRelay,
                IsShooting = _addActivityViewModel.IsShooting,
                IsPass = _addActivityViewModel.IsPass,
                IsBallLeading = _addActivityViewModel.IsBallLeading,
                IsFlexibility = _addActivityViewModel.IsFlexibility,
                IsStrength = _addActivityViewModel.IsStrength,
                IsDynamic = _addActivityViewModel.IsDynamic,
                IsReleasing = _addActivityViewModel.IsReleasing,
                IsSpeed = _addActivityViewModel.IsSpeed,
                IsPersistence = _addActivityViewModel.IsPersistence,
                IsThinking = _addActivityViewModel.IsThinking,
                IsTeamWork = _addActivityViewModel.IsTeamWork,
                IsFlorballBallsNeeded = _addActivityViewModel.IsFlorballBallsNeeded,
                IsFlorballGateNeeded = _addActivityViewModel.IsFlorballGateNeeded,
                IsResulutionDressNeeded = _addActivityViewModel.IsResulutionDressNeeded,
                IsConeNeeded = _addActivityViewModel.IsConeNeeded,
                IsHurdleNeeded = _addActivityViewModel.IsHurdleNeeded,
                IsJumpingLadderNeeded = _addActivityViewModel.IsJumpingLadderNeeded,
                IsJumpingRopeNeeded = _addActivityViewModel.IsJumpingRopeNeeded,
                IsFootballBallNeeded = _addActivityViewModel.IsFootballBallNeeded
            }
               ;

            try
            {
                await _teamStore.AddActivity(activity);

                _activityListingNavigationService.Navigate();
            }
            catch (Exception e)
            {
                MessageBox.Show($"Chyba při ukládání nové aktivity - {e.Message} - {e.InnerException?.Message}", "Chyba", MessageBoxButton.OK, MessageBoxImage.Error);
            }

            _addActivityViewModel.IsSubmitting = false;
        }
    }
}