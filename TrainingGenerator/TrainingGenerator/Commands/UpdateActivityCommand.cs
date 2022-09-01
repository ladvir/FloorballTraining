using System;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Windows;
using System.Xml.Linq;
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
            var activity = new Activity
            {
                ActivityId = _updateActivityViewModel.Id,
                Name = _updateActivityViewModel.Name,
                Description = _updateActivityViewModel.Description,
                PersonsMin = _updateActivityViewModel.PersonsMin,
                PersonsMax = _updateActivityViewModel.PersonsMax,
                DurationMax = _updateActivityViewModel.DurationMax,
                RatingSum = _updateActivityViewModel.RatingSum,
                RatingCount = _updateActivityViewModel.RatingCount,
                IsGameSituation1x1 = _updateActivityViewModel.IsGameSituation1x1,
                IsGameSituation2x2 = _updateActivityViewModel.IsGameSituation2x2,
                IsGameSituation3x3 = _updateActivityViewModel.IsGameSituation3x3,
                IsGameSituation4x4 = _updateActivityViewModel.IsGameSituation4x4,
                IsGameSituation5x5 = _updateActivityViewModel.IsGameSituation5x5,
                IsGameSituation2x3 = _updateActivityViewModel.IsGameSituation2x3,
                IsGameSituation2x1 = _updateActivityViewModel.IsGameSituation2x1,
                IsForGoalman = _updateActivityViewModel.IsForGoalman,
                IsForForward = _updateActivityViewModel.IsForForward,
                IsForDefender = _updateActivityViewModel.IsForDefender,
                IsTrainingPartWarmUp = _updateActivityViewModel.IsTrainingPartWarmUp,
                IsTrainingWarmUpExcercise = _updateActivityViewModel.IsTrainingWarmUpExcercise,
                IsTrainingPartDril = _updateActivityViewModel.IsTrainingPartDril,
                IsTrainingPartStretching = _updateActivityViewModel.IsTrainingPartStretching,
                IsGame = _updateActivityViewModel.IsGame,
                IsFlorbal = _updateActivityViewModel.IsFlorbal,
                IsTest = _updateActivityViewModel.IsTest,
                IsRelay = _updateActivityViewModel.IsRelay,
                IsShooting = _updateActivityViewModel.IsShooting,
                IsPass = _updateActivityViewModel.IsPass,
                IsBallLeading = _updateActivityViewModel.IsBallLeading,
                IsFlexibility = _updateActivityViewModel.IsFlexibility,
                IsStrength = _updateActivityViewModel.IsStrength,
                IsDynamic = _updateActivityViewModel.IsDynamic,
                IsReleasing = _updateActivityViewModel.IsReleasing,
                IsSpeed = _updateActivityViewModel.IsSpeed,
                IsPersistence = _updateActivityViewModel.IsPersistence,
                IsThinking = _updateActivityViewModel.IsThinking,
                IsTeamWork = _updateActivityViewModel.IsTeamWork,
                IsFlorballBallsNeeded = _updateActivityViewModel.IsFlorballBallsNeeded,
                IsFlorballGateNeeded = _updateActivityViewModel.IsFlorballGateNeeded,
                IsResulutionDressNeeded = _updateActivityViewModel.IsResulutionDressNeeded,
                IsConeNeeded = _updateActivityViewModel.IsConeNeeded,
                IsHurdleNeeded = _updateActivityViewModel.IsHurdleNeeded,
                IsJumpingLadderNeeded = _updateActivityViewModel.IsJumpingLadderNeeded,
                IsJumpingRopeNeeded = _updateActivityViewModel.IsJumpingRopeNeeded,
                IsFootballBallNeeded = _updateActivityViewModel.IsFootballBallNeeded
            };

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