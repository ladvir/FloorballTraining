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
            var activity = new Activity(
                0,
                _addActivityViewModel.Name,
_addActivityViewModel.Description,
_addActivityViewModel.PersonsMin,
_addActivityViewModel.PersonsMax,
_addActivityViewModel.DurationMin,
_addActivityViewModel.DurationMax,
_addActivityViewModel.RatingSum,
_addActivityViewModel.RatingCount,
_addActivityViewModel.IsGameSituation1x1,
_addActivityViewModel.IsGameSituation2x2,
_addActivityViewModel.IsGameSituation3x3,
_addActivityViewModel.IsGameSituation4x4,
_addActivityViewModel.IsGameSituation5x5,
_addActivityViewModel.IsGameSituation2x3,
_addActivityViewModel.IsGameSituation2x1,
_addActivityViewModel.IsForGoalman,
_addActivityViewModel.IsForForward,
_addActivityViewModel.IsForDefender,
_addActivityViewModel.IsTrainingPartWarmUp,
_addActivityViewModel.IsTrainingWarmUpExcercise,
_addActivityViewModel.IsTrainingPartDril,
_addActivityViewModel.IsTrainingPartStretching,
_addActivityViewModel.IsGame,
_addActivityViewModel.IsFlorbal,
_addActivityViewModel.IsTest,
_addActivityViewModel.IsRelay,
_addActivityViewModel.IsShooting,
_addActivityViewModel.IsPass,
_addActivityViewModel.IsBallLeading,
_addActivityViewModel.IsFlexibility,
_addActivityViewModel.IsStrength,
_addActivityViewModel.IsDynamic,
_addActivityViewModel.IsReleasing,
_addActivityViewModel.IsSpeed,
_addActivityViewModel.IsPersistence,
_addActivityViewModel.IsThinking,
_addActivityViewModel.IsTeamWork,
_addActivityViewModel.IsFlorballBallsNeeded,
_addActivityViewModel.IsFlorballGateNeeded,
_addActivityViewModel.IsResulutionDressNeeded,
_addActivityViewModel.IsConeNeeded,
_addActivityViewModel.IsHurdleNeeded,
_addActivityViewModel.IsJumpingLadderNeeded,
_addActivityViewModel.IsJumpingRopeNeeded,
_addActivityViewModel.IsFootballBallNeeded

            );

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