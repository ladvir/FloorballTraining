using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class ActivityDetailViewModel : ViewModelBase, INotifyDataErrorInfo
    {
        private int _id;
        private string _name;
        private string _description;
        private int _durationMin = 5;
        private int _personsMin = 5;
        private int _personsMax = 15;

        private int? _durationMax;
        private long _ratingSum;
        private long _ratingCount;
        private bool _isGameSituation1x1;
        private bool _isGameSituation2x2;
        private bool _isGameSituation3x3;
        private bool _isGameSituation4x4;
        private bool _isGameSituation5x5;
        private bool _isGameSituation2x3;
        private bool _isGameSituation2x1;
        private bool _isForGoalman;
        private bool _isForForward;
        private bool _isForDefender;
        private bool _isTrainingPartWarmUp;
        private bool _isTrainingWarmUpExcercise;
        private bool _isTrainingPartDril;
        private bool _isTrainingPartStretching;
        private bool _isGame;
        private bool _isFlorbal;
        private bool _isTest;
        private bool _isRelay;
        private bool _isShooting;
        private bool _isPass;
        private bool _isBallLeading;
        private bool _isFlexibility;
        private bool _isStrength;
        private bool _isDynamic;
        private bool _isReleasing;
        private bool _isSpeed;
        private bool _isPersistence;
        private bool _isThinking;
        private bool _isTeamWork;
        private bool _isFlorballBallsNeeded;
        private bool _isFlorballGateNeeded;
        private bool _isResulutionDressNeeded;
        private bool _isConeNeeded;
        private bool _isHurdleNeeded;
        private bool _isJumpingLadderNeeded;
        private bool _isJumpingRopeNeeded;
        private bool _isFootballBallNeeded;

        private readonly Dictionary<string, List<string>> _propertyNameToErrorsDictionary;

        public int Id
        {
            get => _id;
            set
            {
                _id = value;
                OnPropertyChanged(nameof(Name));
            }
        }

        public string Name
        {
            get => _name;
            set
            {
                _name = value;
                OnPropertyChanged(nameof(Name));

                ClearErrors(nameof(Name));

                if (!HasName)
                {
                    AddError("Název aktivity nemůže být prázdný", nameof(Name));
                }

                OnPropertyChanged(nameof(CanUpdateActivity));
            }
        }

        public string Description
        {
            get
            {
                return _description;
            }

            set
            {
                _description = value;
                OnPropertyChanged(nameof(Description));

                ClearErrors(nameof(Description));

                if (!HasDescription)
                {
                    AddError("Popis aktivity nemůže být prázdný", nameof(Description));
                }

                OnPropertyChanged(nameof(CanUpdateActivity));
            }
        }

        public int DurationMin
        {
            get => _durationMin;
            set
            {
                _durationMin = value;
                OnPropertyChanged(nameof(DurationMin));

                ClearErrors(nameof(DurationMin));

                if (!HasDuration)
                {
                    AddError("Zadej, jak dlouho trvá aktivita ", nameof(DurationMin));
                }

                OnPropertyChanged(nameof(CanUpdateActivity));
            }
        }

        public int? PersonsMin
        {
            get => _personsMin;
            set
            {
                _personsMin = value.GetValueOrDefault();
                OnPropertyChanged(nameof(PersonsMin));

                ClearErrors(nameof(PersonsMax));
                ClearErrors(nameof(PersonsMin));

                if (!HasPersonsMinGreaterOrEqualToPersonsMax)
                {
                    AddError("Minimální počet osob nesmí být větší než maximální počet osob.", nameof(PersonsMin));
                }

                OnPropertyChanged(nameof(CanUpdateActivity));
            }
        }

        public int PersonsMax
        {
            get => _personsMax;
            set
            {
                _personsMax = value;
                OnPropertyChanged(nameof(PersonsMax));

                ClearErrors(nameof(PersonsMax));
                ClearErrors(nameof(PersonsMin));

                if (!HasPersonsMinGreaterOrEqualToPersonsMax)
                {
                    AddError("Minimální počet osob nesmí být větší než maximální počet osob.", nameof(PersonsMax));
                }

                OnPropertyChanged(nameof(CanUpdateActivity));
            }
        }

        /**/

        public int? DurationMax
        { get => _durationMax; set { _durationMax = value; OnPropertyChanged(nameof(DurationMax)); ClearErrors(nameof(DurationMax)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public long RatingSum
        { get => _ratingSum; set { _ratingSum = value; OnPropertyChanged(nameof(RatingSum)); ClearErrors(nameof(RatingSum)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public long RatingCount
        { get => _ratingCount; set { _ratingCount = value; OnPropertyChanged(nameof(RatingCount)); ClearErrors(nameof(RatingCount)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsGameSituation1x1
        { get => _isGameSituation1x1; set { _isGameSituation1x1 = value; OnPropertyChanged(nameof(IsGameSituation1x1)); ClearErrors(nameof(IsGameSituation1x1)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsGameSituation2x2
        { get => _isGameSituation2x2; set { _isGameSituation2x2 = value; OnPropertyChanged(nameof(IsGameSituation2x2)); ClearErrors(nameof(IsGameSituation2x2)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsGameSituation3x3
        { get => _isGameSituation3x3; set { _isGameSituation3x3 = value; OnPropertyChanged(nameof(IsGameSituation3x3)); ClearErrors(nameof(IsGameSituation3x3)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsGameSituation4x4
        { get => _isGameSituation4x4; set { _isGameSituation4x4 = value; OnPropertyChanged(nameof(IsGameSituation4x4)); ClearErrors(nameof(IsGameSituation4x4)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsGameSituation5x5
        { get => _isGameSituation5x5; set { _isGameSituation5x5 = value; OnPropertyChanged(nameof(IsGameSituation5x5)); ClearErrors(nameof(IsGameSituation5x5)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsGameSituation2x3
        { get => _isGameSituation2x3; set { _isGameSituation2x3 = value; OnPropertyChanged(nameof(IsGameSituation2x3)); ClearErrors(nameof(IsGameSituation2x3)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsGameSituation2x1
        { get => _isGameSituation2x1; set { _isGameSituation2x1 = value; OnPropertyChanged(nameof(IsGameSituation2x1)); ClearErrors(nameof(IsGameSituation2x1)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsForGoalman
        { get => _isForGoalman; set { _isForGoalman = value; OnPropertyChanged(nameof(IsForGoalman)); ClearErrors(nameof(IsForGoalman)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsForForward
        { get => _isForForward; set { _isForForward = value; OnPropertyChanged(nameof(IsForForward)); ClearErrors(nameof(IsForForward)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsForDefender
        { get => _isForDefender; set { _isForDefender = value; OnPropertyChanged(nameof(IsForDefender)); ClearErrors(nameof(IsForDefender)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsTrainingPartWarmUp
        { get => _isTrainingPartWarmUp; set { _isTrainingPartWarmUp = value; OnPropertyChanged(nameof(IsTrainingPartWarmUp)); ClearErrors(nameof(IsTrainingPartWarmUp)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsTrainingWarmUpExcercise
        { get => _isTrainingWarmUpExcercise; set { _isTrainingWarmUpExcercise = value; OnPropertyChanged(nameof(IsTrainingWarmUpExcercise)); ClearErrors(nameof(IsTrainingWarmUpExcercise)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsTrainingPartDril
        { get => _isTrainingPartDril; set { _isTrainingPartDril = value; OnPropertyChanged(nameof(IsTrainingPartDril)); ClearErrors(nameof(IsTrainingPartDril)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsTrainingPartStretching
        { get => _isTrainingPartStretching; set { _isTrainingPartStretching = value; OnPropertyChanged(nameof(IsTrainingPartStretching)); ClearErrors(nameof(IsTrainingPartStretching)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsGame
        { get => _isGame; set { _isGame = value; OnPropertyChanged(nameof(IsGame)); ClearErrors(nameof(IsGame)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsFlorbal
        { get => _isFlorbal; set { _isFlorbal = value; OnPropertyChanged(nameof(IsFlorbal)); ClearErrors(nameof(IsFlorbal)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsTest
        { get => _isTest; set { _isTest = value; OnPropertyChanged(nameof(IsTest)); ClearErrors(nameof(IsTest)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsRelay
        { get => _isRelay; set { _isRelay = value; OnPropertyChanged(nameof(IsRelay)); ClearErrors(nameof(IsRelay)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsShooting
        { get => _isShooting; set { _isShooting = value; OnPropertyChanged(nameof(IsShooting)); ClearErrors(nameof(IsShooting)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsPass
        { get => _isPass; set { _isPass = value; OnPropertyChanged(nameof(IsPass)); ClearErrors(nameof(IsPass)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsBallLeading
        { get => _isBallLeading; set { _isBallLeading = value; OnPropertyChanged(nameof(IsBallLeading)); ClearErrors(nameof(IsBallLeading)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsFlexibility
        { get => _isFlexibility; set { _isFlexibility = value; OnPropertyChanged(nameof(IsFlexibility)); ClearErrors(nameof(IsFlexibility)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsStrength
        { get => _isStrength; set { _isStrength = value; OnPropertyChanged(nameof(IsStrength)); ClearErrors(nameof(IsStrength)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsDynamic
        { get => _isDynamic; set { _isDynamic = value; OnPropertyChanged(nameof(IsDynamic)); ClearErrors(nameof(IsDynamic)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsReleasing
        { get => _isReleasing; set { _isReleasing = value; OnPropertyChanged(nameof(IsReleasing)); ClearErrors(nameof(IsReleasing)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsSpeed
        { get => _isSpeed; set { _isSpeed = value; OnPropertyChanged(nameof(IsSpeed)); ClearErrors(nameof(IsSpeed)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsPersistence
        { get => _isPersistence; set { _isPersistence = value; OnPropertyChanged(nameof(IsPersistence)); ClearErrors(nameof(IsPersistence)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsThinking
        { get => _isThinking; set { _isThinking = value; OnPropertyChanged(nameof(IsThinking)); ClearErrors(nameof(IsThinking)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsTeamWork
        { get => _isTeamWork; set { _isTeamWork = value; OnPropertyChanged(nameof(IsTeamWork)); ClearErrors(nameof(IsTeamWork)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsFlorballBallsNeeded
        { get => _isFlorballBallsNeeded; set { _isFlorballBallsNeeded = value; OnPropertyChanged(nameof(IsFlorballBallsNeeded)); ClearErrors(nameof(IsFlorballBallsNeeded)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsFlorballGateNeeded
        { get => _isFlorballGateNeeded; set { _isFlorballGateNeeded = value; OnPropertyChanged(nameof(IsFlorballGateNeeded)); ClearErrors(nameof(IsFlorballGateNeeded)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsResulutionDressNeeded
        { get => _isResulutionDressNeeded; set { _isResulutionDressNeeded = value; OnPropertyChanged(nameof(IsResulutionDressNeeded)); ClearErrors(nameof(IsResulutionDressNeeded)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsConeNeeded
        { get => _isConeNeeded; set { _isConeNeeded = value; OnPropertyChanged(nameof(IsConeNeeded)); ClearErrors(nameof(IsConeNeeded)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsHurdleNeeded
        { get => _isHurdleNeeded; set { _isHurdleNeeded = value; OnPropertyChanged(nameof(IsHurdleNeeded)); ClearErrors(nameof(IsHurdleNeeded)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsJumpingLadderNeeded
        { get => _isJumpingLadderNeeded; set { _isJumpingLadderNeeded = value; OnPropertyChanged(nameof(IsJumpingLadderNeeded)); ClearErrors(nameof(IsJumpingLadderNeeded)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsJumpingRopeNeeded
        { get => _isJumpingRopeNeeded; set { _isJumpingRopeNeeded = value; OnPropertyChanged(nameof(IsJumpingRopeNeeded)); ClearErrors(nameof(IsJumpingRopeNeeded)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        public bool IsFootballBallNeeded
        { get => _isFootballBallNeeded; set { _isFootballBallNeeded = value; OnPropertyChanged(nameof(IsFootballBallNeeded)); ClearErrors(nameof(IsFootballBallNeeded)); OnPropertyChanged(nameof(CanUpdateActivity)); } }

        /********/

        public bool CanUpdateActivity =>
            HasName &&
            HasDescription &&
            HasPersonsMinGreaterOrEqualToPersonsMax &&
            HasDuration &&
            !HasErrors;

        private bool HasName => !string.IsNullOrEmpty(Name);
        private bool HasDescription => !string.IsNullOrEmpty(Description);
        private bool HasPersonsMinGreaterOrEqualToPersonsMax => PersonsMin <= PersonsMax;

        private bool HasDuration => DurationMin > 0;

        private string _submitErrorMessage;

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

        public string SubmitErrorMessage
        {
            get
            {
                return _submitErrorMessage;
            }
            set
            {
                _submitErrorMessage = value;
                OnPropertyChanged(nameof(SubmitErrorMessage));

                OnPropertyChanged(nameof(HasSubmitErrorMessage));
            }
        }

        public bool HasErrorMessage => !string.IsNullOrEmpty(ErrorMessage);

        public bool HasSubmitErrorMessage => !string.IsNullOrEmpty(SubmitErrorMessage);

        private bool _isSubmitting;

        public bool IsSubmitting
        {
            get
            {
                return _isSubmitting;
            }
            set
            {
                _isSubmitting = value;
                OnPropertyChanged(nameof(IsSubmitting));
            }
        }

        public ICommand SaveCommand { get; }

        public ICommand DeleteCommand { get; }
        public ICommand CancelCommand { get; }

        public ICommand OpenActivityDetailCommand { get; }

        public bool HasErrors => _propertyNameToErrorsDictionary.Any();

        public event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;

        public ActivityDetailViewModel(
        TeamStore teamStore,
        NavigationService<ActivityListingViewModel> navigationService)
        {
            SaveCommand = new UpdateActivityCommand(teamStore, this, navigationService);
            DeleteCommand = new DeleteActivityCommand(teamStore, this, navigationService);

            CancelCommand = new NavigateCommand<ActivityListingViewModel>(navigationService);

            OpenActivityDetailCommand = new OpenActivityDetailCommand(teamStore, this);

            _propertyNameToErrorsDictionary = new Dictionary<string, List<string>>();
        }

        public static ActivityDetailViewModel LoadViewModel(TeamStore teamStore, NavigationService<ActivityListingViewModel> activityListingNavigationService)
        {
            var viewModel = new ActivityDetailViewModel(teamStore, activityListingNavigationService);

            viewModel.OpenActivityDetailCommand.Execute(teamStore.SelectedActivity);

            return viewModel;
        }

        public void OpenActivity(Activity activity)
        {
            _id = activity.ActivityId;

            Name = activity.Name;
            Description = activity.Description;
            PersonsMax = activity.PersonsMax.GetValueOrDefault();
            PersonsMin = activity.PersonsMin;
            DurationMin = activity.DurationMin.GetValueOrDefault();
        }

        public IEnumerable GetErrors(string propertyName)
        {
            return _propertyNameToErrorsDictionary.GetValueOrDefault(propertyName, new List<string>());
        }

        public IEnumerable GetErrors()
        {
            return _propertyNameToErrorsDictionary.SelectMany(e => e.Value);
        }

        private void AddError(string errorMessage, string propertyName)
        {
            if (!_propertyNameToErrorsDictionary.ContainsKey(propertyName))
            {
                _propertyNameToErrorsDictionary.Add(propertyName, new List<string>());
            }

            _propertyNameToErrorsDictionary[propertyName].Add(errorMessage);

            OnErrorsChanged(propertyName);
        }

        private void ClearErrors(string propertyName)
        {
            _propertyNameToErrorsDictionary.Remove(propertyName);

            OnErrorsChanged(propertyName);
        }

        private void OnErrorsChanged(string propertyName)
        {
            ErrorsChanged?.Invoke(this, new DataErrorsChangedEventArgs(propertyName));

            if (HasErrors)
            {
                SubmitErrorMessage = string.Join("\n", GetErrors().Cast<string>());
            }
            else
            {
                SubmitErrorMessage = string.Empty;
            }
        }
    }
}