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
    public class UpdateActivityCommand : AsyncCommandBase
    {
        private readonly ActivityDetailViewModel _updateActivityViewModel;
        private readonly NavigationService<ActivityListingViewModel> _activityListingNavigationService;
        private readonly TeamStore _teamStore;

        public UpdateActivityCommand(TeamStore teamStore,
        ActivityDetailViewModel UpdateActivityViewModel,
        NavigationService<ActivityListingViewModel> activityListingNavigationService)
        {
            _activityListingNavigationService = activityListingNavigationService;
            _teamStore = teamStore;
            _updateActivityViewModel = UpdateActivityViewModel;
            _updateActivityViewModel.PropertyChanged += OnViewModelPropertyChanged;
        }

        private void OnViewModelPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(ActivityDetailViewModel.CanUpdateActivity))
            {
                OnCanExecutedChanged();
            }
        }

        public override bool CanExecute(object parameter)
        {
            return _updateActivityViewModel.CanUpdateActivity && base.CanExecute(parameter);
        }

        public override async Task ExecuteAsync(object parameter)
        {
            _updateActivityViewModel.SubmitErrorMessage = string.Empty;
            _updateActivityViewModel.IsSubmitting = true;
            var activity = new Activity(
                _updateActivityViewModel.Id,
                _updateActivityViewModel.Name,
                _updateActivityViewModel.Description,
                _updateActivityViewModel.PersonsMin,
                _updateActivityViewModel.PersonsMax,
                _updateActivityViewModel.DurationMin,
                _updateActivityViewModel.DurationMax,
                _updateActivityViewModel.RatingSum,
                _updateActivityViewModel.RatingCount,
                _updateActivityViewModel.IsGameSituation1x1,
                _updateActivityViewModel.IsGameSituation2x2,
                _updateActivityViewModel.IsGameSituation3x3,
                _updateActivityViewModel.IsGameSituation4x4,
                _updateActivityViewModel.IsGameSituation5x5,
                _updateActivityViewModel.IsGameSituation2x3,
                _updateActivityViewModel.IsGameSituation2x1,
                _updateActivityViewModel.IsForGoalman,
                _updateActivityViewModel.IsForForward,
                _updateActivityViewModel.IsForDefender,
                _updateActivityViewModel.IsTrainingPartWarmUp,
                _updateActivityViewModel.IsTrainingWarmUpExcercise,
                _updateActivityViewModel.IsTrainingPartDril,
                _updateActivityViewModel.IsTrainingPartStretching,
                _updateActivityViewModel.IsGame,
                _updateActivityViewModel.IsFlorbal,
                _updateActivityViewModel.IsTest,
                _updateActivityViewModel.IsRelay,
                _updateActivityViewModel.IsShooting,
                _updateActivityViewModel.IsPass,
                _updateActivityViewModel.IsBallLeading,
                _updateActivityViewModel.IsFlexibility,
                _updateActivityViewModel.IsStrength,
                _updateActivityViewModel.IsDynamic,
                _updateActivityViewModel.IsReleasing,
                _updateActivityViewModel.IsSpeed,
                _updateActivityViewModel.IsPersistence,
                _updateActivityViewModel.IsThinking,
                _updateActivityViewModel.IsTeamWork,
                _updateActivityViewModel.IsFlorballBallsNeeded,
                _updateActivityViewModel.IsFlorballGateNeeded,
                _updateActivityViewModel.IsResulutionDressNeeded,
                _updateActivityViewModel.IsConeNeeded,
                _updateActivityViewModel.IsHurdleNeeded,
                _updateActivityViewModel.IsJumpingLadderNeeded,
                _updateActivityViewModel.IsJumpingRopeNeeded,
                _updateActivityViewModel.IsFootballBallNeeded
            );

            try
            {
                await _teamStore.UpdateActivity(activity);

                _activityListingNavigationService.Navigate();
            }
            catch (Exception e)
            {
                MessageBox.Show($"Chyba při ukládání aktivity - {e.Message} - {e.InnerException?.Message}", "Chyba", MessageBoxButton.OK, MessageBoxImage.Error);
            }

            _updateActivityViewModel.IsSubmitting = false;
        }
    }

    public class DeleteActivityCommand : AsyncCommandBase
    {
        private readonly ActivityDetailViewModel _activityDetailViewModel;
        private readonly NavigationService<ActivityListingViewModel> _activityListingNavigationService;
        private readonly TeamStore _teamStore;

        public DeleteActivityCommand(TeamStore teamStore,
        ActivityDetailViewModel activityDetailViewModel,
        NavigationService<ActivityListingViewModel> activityListingNavigationService)
        {
            _activityListingNavigationService = activityListingNavigationService;
            _teamStore = teamStore;
            _activityDetailViewModel = activityDetailViewModel;
        }

        private void OnViewModelPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(ActivityDetailViewModel.CanUpdateActivity))
            {
                OnCanExecutedChanged();
            }
        }

        public override async Task ExecuteAsync(object parameter)
        {
            _activityDetailViewModel.SubmitErrorMessage = string.Empty;

            try
            {
                var confirmation = MessageBox.Show("Opravdu si přejete aktivitu smazat?", "Mazání aktivity", MessageBoxButton.YesNo);

                if (confirmation == MessageBoxResult.Yes)
                {
                    _activityDetailViewModel.IsSubmitting = true;

                    var activity = await _teamStore.GetActivity(_activityDetailViewModel.Id);

                    await _teamStore.DeleteActivity(activity);
                }

                _activityListingNavigationService.Navigate();
            }
            catch (Exception e)
            {
                MessageBox.Show($"Chyba při mazání aktivity - {e.Message} - {e.InnerException?.Message}", "Chyba", MessageBoxButton.OK, MessageBoxImage.Error);
            }

            _activityDetailViewModel.IsSubmitting = false;
        }
    }
}