using NUnit.Framework.Interfaces;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Windows.Controls;
using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class AddTrainingViewModel : ViewModelBase, INotifyDataErrorInfo
    {
        private int _id;
        private string _name;
        private int _duration;
        private int _personsMax;
        private int _florbalPercent;
        private string _note;
        private long _ratingSum;
        private long _ratingCount;
        private int _beginTimeMax;
        private int _warmUpTimeMax;
        private int _warmUpExcerciseTimeMax;
        private int _drilTimeMax;
        private int _stretchingTimeMax;
        private int _endTimeMax;
        private int _blockPauseTimeMax;
        private int _activityPauseTimeMax;

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

        private ObservableCollection<TrainingActivity> _trainingActivities = new ObservableCollection<TrainingActivity>();

        public ICollection<TrainingActivity> TrainingActivities => _trainingActivities;

        public IList<TrainingActivity> SelectedTrainingActivities = new List<TrainingActivity>();

        public ListView TrainingActivitiesListView;

        private readonly Dictionary<string, List<string>> _propertyNameToErrorsDictionary;



        public int ActivitiesDurationSum {
            get => _trainingActivities.Sum(ta => ta.DurationMax);
        }
        

        public int Id
        { get => _id; set { _id = value; OnPropertyChanged(nameof(Id)); ClearErrors(nameof(Id)); OnPropertyChanged(nameof(CanSave)); } }

        public string Name
        { get => _name; set { _name = value; OnPropertyChanged(nameof(Name)); ClearErrors(nameof(Name)); OnPropertyChanged(nameof(CanSave)); } }

        public int Duration
        {
            get => _duration;
            set
            {
                _duration = value;
                OnPropertyChanged(nameof(Duration));

                ClearErrors(nameof(Duration));

                if (!HasDuration)
                {
                    AddError("Zadej, jak dlouho má trvat trénink", nameof(Duration));
                }

                OnPropertyChanged(nameof(CanSave));
            }
        }

        public int PersonsMax
        { get => _personsMax; set { _personsMax = value; OnPropertyChanged(nameof(PersonsMax)); ClearErrors(nameof(PersonsMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int FlorbalPercent
        { get => _florbalPercent; set { _florbalPercent = value; OnPropertyChanged(nameof(FlorbalPercent)); ClearErrors(nameof(FlorbalPercent)); OnPropertyChanged(nameof(CanSave)); } }

        public string Note
        { get => _note; set { _note = value; OnPropertyChanged(nameof(Note)); ClearErrors(nameof(Note)); OnPropertyChanged(nameof(CanSave)); } }

        public long RatingSum
        { get => _ratingSum; set { _ratingSum = value; OnPropertyChanged(nameof(RatingSum)); ClearErrors(nameof(RatingSum)); OnPropertyChanged(nameof(CanSave)); } }

        public long RatingCount
        { get => _ratingCount; set { _ratingCount = value; OnPropertyChanged(nameof(RatingCount)); ClearErrors(nameof(RatingCount)); OnPropertyChanged(nameof(CanSave)); } }

        public int BeginTimeMax
        { get => _beginTimeMax; set { _beginTimeMax = value; OnPropertyChanged(nameof(BeginTimeMax)); ClearErrors(nameof(BeginTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int WarmUpTimeMax
        { get => _warmUpTimeMax; set { _warmUpTimeMax = value; OnPropertyChanged(nameof(WarmUpTimeMax)); ClearErrors(nameof(WarmUpTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int WarmUpExcerciseTimeMax
        { get => _warmUpExcerciseTimeMax; set { _warmUpExcerciseTimeMax = value; OnPropertyChanged(nameof(WarmUpExcerciseTimeMax)); ClearErrors(nameof(WarmUpExcerciseTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int DrilTimeMax
        { get => _drilTimeMax; set { _drilTimeMax = value; OnPropertyChanged(nameof(DrilTimeMax)); ClearErrors(nameof(DrilTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int StretchingTimeMax
        { get => _stretchingTimeMax; set { _stretchingTimeMax = value; OnPropertyChanged(nameof(StretchingTimeMax)); ClearErrors(nameof(StretchingTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int EndTimeMax
        { get => _endTimeMax; set { _endTimeMax = value; OnPropertyChanged(nameof(EndTimeMax)); ClearErrors(nameof(EndTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int BlockPauseTimeMax
        { get => _blockPauseTimeMax; set { _blockPauseTimeMax = value; OnPropertyChanged(nameof(BlockPauseTimeMax)); ClearErrors(nameof(BlockPauseTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int ActivityPauseTimeMax
        { get => _activityPauseTimeMax; set { _activityPauseTimeMax = value; OnPropertyChanged(nameof(ActivityPauseTimeMax)); ClearErrors(nameof(ActivityPauseTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsGameSituation1x1
        { get => _isGameSituation1x1; set { _isGameSituation1x1 = value; OnPropertyChanged(nameof(IsGameSituation1x1)); ClearErrors(nameof(IsGameSituation1x1)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsGameSituation2x2
        { get => _isGameSituation2x2; set { _isGameSituation2x2 = value; OnPropertyChanged(nameof(IsGameSituation2x2)); ClearErrors(nameof(IsGameSituation2x2)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsGameSituation3x3
        { get => _isGameSituation3x3; set { _isGameSituation3x3 = value; OnPropertyChanged(nameof(IsGameSituation3x3)); ClearErrors(nameof(IsGameSituation3x3)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsGameSituation4x4
        { get => _isGameSituation4x4; set { _isGameSituation4x4 = value; OnPropertyChanged(nameof(IsGameSituation4x4)); ClearErrors(nameof(IsGameSituation4x4)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsGameSituation5x5
        { get => _isGameSituation5x5; set { _isGameSituation5x5 = value; OnPropertyChanged(nameof(IsGameSituation5x5)); ClearErrors(nameof(IsGameSituation5x5)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsGameSituation2x3
        { get => _isGameSituation2x3; set { _isGameSituation2x3 = value; OnPropertyChanged(nameof(IsGameSituation2x3)); ClearErrors(nameof(IsGameSituation2x3)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsGameSituation2x1
        { get => _isGameSituation2x1; set { _isGameSituation2x1 = value; OnPropertyChanged(nameof(IsGameSituation2x1)); ClearErrors(nameof(IsGameSituation2x1)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsForGoalman
        { get => _isForGoalman; set { _isForGoalman = value; OnPropertyChanged(nameof(IsForGoalman)); ClearErrors(nameof(IsForGoalman)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsForForward
        { get => _isForForward; set { _isForForward = value; OnPropertyChanged(nameof(IsForForward)); ClearErrors(nameof(IsForForward)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsForDefender
        { get => _isForDefender; set { _isForDefender = value; OnPropertyChanged(nameof(IsForDefender)); ClearErrors(nameof(IsForDefender)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsTrainingPartWarmUp
        { get => _isTrainingPartWarmUp; set { _isTrainingPartWarmUp = value; OnPropertyChanged(nameof(IsTrainingPartWarmUp)); ClearErrors(nameof(IsTrainingPartWarmUp)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsTrainingWarmUpExcercise
        { get => _isTrainingWarmUpExcercise; set { _isTrainingWarmUpExcercise = value; OnPropertyChanged(nameof(IsTrainingWarmUpExcercise)); ClearErrors(nameof(IsTrainingWarmUpExcercise)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsTrainingPartDril
        { get => _isTrainingPartDril; set { _isTrainingPartDril = value; OnPropertyChanged(nameof(IsTrainingPartDril)); ClearErrors(nameof(IsTrainingPartDril)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsTrainingPartStretching
        { get => _isTrainingPartStretching; set { _isTrainingPartStretching = value; OnPropertyChanged(nameof(IsTrainingPartStretching)); ClearErrors(nameof(IsTrainingPartStretching)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsGame
        { get => _isGame; set { _isGame = value; OnPropertyChanged(nameof(IsGame)); ClearErrors(nameof(IsGame)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsFlorbal
        { get => _isFlorbal; set { _isFlorbal = value; OnPropertyChanged(nameof(IsFlorbal)); ClearErrors(nameof(IsFlorbal)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsTest
        { get => _isTest; set { _isTest = value; OnPropertyChanged(nameof(IsTest)); ClearErrors(nameof(IsTest)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsRelay
        { get => _isRelay; set { _isRelay = value; OnPropertyChanged(nameof(IsRelay)); ClearErrors(nameof(IsRelay)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsShooting
        { get => _isShooting; set { _isShooting = value; OnPropertyChanged(nameof(IsShooting)); ClearErrors(nameof(IsShooting)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsPass
        { get => _isPass; set { _isPass = value; OnPropertyChanged(nameof(IsPass)); ClearErrors(nameof(IsPass)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsBallLeading
        { get => _isBallLeading; set { _isBallLeading = value; OnPropertyChanged(nameof(IsBallLeading)); ClearErrors(nameof(IsBallLeading)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsFlexibility
        { get => _isFlexibility; set { _isFlexibility = value; OnPropertyChanged(nameof(IsFlexibility)); ClearErrors(nameof(IsFlexibility)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsStrength
        { get => _isStrength; set { _isStrength = value; OnPropertyChanged(nameof(IsStrength)); ClearErrors(nameof(IsStrength)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsDynamic
        { get => _isDynamic; set { _isDynamic = value; OnPropertyChanged(nameof(IsDynamic)); ClearErrors(nameof(IsDynamic)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsReleasing
        { get => _isReleasing; set { _isReleasing = value; OnPropertyChanged(nameof(IsReleasing)); ClearErrors(nameof(IsReleasing)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsSpeed
        { get => _isSpeed; set { _isSpeed = value; OnPropertyChanged(nameof(IsSpeed)); ClearErrors(nameof(IsSpeed)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsPersistence
        { get => _isPersistence; set { _isPersistence = value; OnPropertyChanged(nameof(IsPersistence)); ClearErrors(nameof(IsPersistence)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsThinking
        { get => _isThinking; set { _isThinking = value; OnPropertyChanged(nameof(IsThinking)); ClearErrors(nameof(IsThinking)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsTeamWork
        { get => _isTeamWork; set { _isTeamWork = value; OnPropertyChanged(nameof(IsTeamWork)); ClearErrors(nameof(IsTeamWork)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsFlorballBallsNeeded
        { get => _isFlorballBallsNeeded; set { _isFlorballBallsNeeded = value; OnPropertyChanged(nameof(IsFlorballBallsNeeded)); ClearErrors(nameof(IsFlorballBallsNeeded)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsFlorballGateNeeded
        { get => _isFlorballGateNeeded; set { _isFlorballGateNeeded = value; OnPropertyChanged(nameof(IsFlorballGateNeeded)); ClearErrors(nameof(IsFlorballGateNeeded)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsResulutionDressNeeded
        { get => _isResulutionDressNeeded; set { _isResulutionDressNeeded = value; OnPropertyChanged(nameof(IsResulutionDressNeeded)); ClearErrors(nameof(IsResulutionDressNeeded)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsConeNeeded
        { get => _isConeNeeded; set { _isConeNeeded = value; OnPropertyChanged(nameof(IsConeNeeded)); ClearErrors(nameof(IsConeNeeded)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsHurdleNeeded
        { get => _isHurdleNeeded; set { _isHurdleNeeded = value; OnPropertyChanged(nameof(IsHurdleNeeded)); ClearErrors(nameof(IsHurdleNeeded)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsJumpingLadderNeeded
        { get => _isJumpingLadderNeeded; set { _isJumpingLadderNeeded = value; OnPropertyChanged(nameof(IsJumpingLadderNeeded)); ClearErrors(nameof(IsJumpingLadderNeeded)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsJumpingRopeNeeded
        { get => _isJumpingRopeNeeded; set { _isJumpingRopeNeeded = value; OnPropertyChanged(nameof(IsJumpingRopeNeeded)); ClearErrors(nameof(IsJumpingRopeNeeded)); OnPropertyChanged(nameof(CanSave)); } }

        public bool IsFootballBallNeeded
        { get => _isFootballBallNeeded; set { _isFootballBallNeeded = value; OnPropertyChanged(nameof(IsFootballBallNeeded)); ClearErrors(nameof(IsFootballBallNeeded)); OnPropertyChanged(nameof(CanSave)); } }

        public bool CanSave =>
            HasName &&
            HasDuration &&
            !HasErrors;

        private bool HasName => !string.IsNullOrEmpty(Name);

        private bool HasDuration => Duration > 0;

        private string _submitErrorMessage;

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
        public ICommand CancelCommand { get; }

        public ICommand GenerateTrainingCommand { get; }

        private ICommand _removeSelectedTrainingActivity;

        public ICommand RemoveSelectedTrainingActivityCommand
        {
            get { return _removeSelectedTrainingActivity ??= new RelayCommand(x => { RemoveSelectedTrainingActivity((TrainingActivity)x); }); }
        }

        private ICommand _moveSelectedTrainingActivityDownCommand;
        public ICommand MoveSelectedTrainingActivityDownCommand 
        {
            get { return _moveSelectedTrainingActivityDownCommand ??= new RelayCommand(x => { MoveSelectedTrainingActivity((TrainingActivity)x, 1); }); }
        }

        private ICommand _moveSelectedTrainingActivityUpCommand;
            public ICommand MoveSelectedTrainingActivityUpCommand 
        {
            get { return _moveSelectedTrainingActivityUpCommand ??= new RelayCommand(x => { MoveSelectedTrainingActivity((TrainingActivity)x, -1); }); }
        }

        private void MoveSelectedTrainingActivity(TrainingActivity trainingActivity, int step)
        {
            foreach(var ta in _trainingActivities) {
                ta.Order = _trainingActivities.IndexOf(ta);
            }


            var indexCurrect = _trainingActivities.IndexOf(trainingActivity);

            var newPosition = indexCurrect+step;


            


            if(newPosition<0 || newPosition>_trainingActivities.Count-1) return;

            _trainingActivities.Move(indexCurrect, newPosition);

            foreach(var ta in _trainingActivities) {

                var index = _trainingActivities.IndexOf(ta);

                if(ta.Order!=index) {
                    ta.Order = index;
                }
            }
        }

        private void RemoveSelectedTrainingActivity(TrainingActivity trainingActivity)
        {
            _trainingActivities.Remove(trainingActivity);
        }

        public bool HasErrors => _propertyNameToErrorsDictionary.Any();

        private bool _isGenerating;

        public bool IsGenerating
        {
            get
            {
                return _isGenerating;
            }
            set
            {
                _isGenerating = value;
                OnPropertyChanged(nameof(IsGenerating));
            }
        }

        public bool CanGenerate => true;
        /*HasPersonsMinGreaterOrEqualToPersonsMax &&
        HasDuration &&
        !HasErrors;*/

        public event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;

        private TeamStore _teamStore;

        public AddTrainingViewModel(TeamStore teamStore, NavigationService<TrainingListingViewModel> navigationService)
        {
            _trainingActivities = new ObservableCollection<TrainingActivity>();
            _propertyNameToErrorsDictionary = new Dictionary<string, List<string>>();

            _teamStore = teamStore;

            _teamStore.LoadActivities();

            SaveCommand = new AddTrainingCommand(teamStore, this, navigationService);
            CancelCommand = new NavigateCommand<TrainingListingViewModel>(navigationService);

            GenerateTrainingCommand = new GenerateTrainingCommand(teamStore, this);
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

        public void GetRandomActivities()
        {
            var random = new Random();

            int triesCount = 0;

            var totalDuration = 0;

            var selectedActivites = new List<TrainingActivity>();

            var alreadyCheckedActivities = new List<Activity>();

            var activitites = _teamStore.Activities;

            var filteredActivities = activitites.Where(a =>
                (a.PersonsMax <= PersonsMax || a.PersonsMax == null || a.PersonsMax == 0)
                && (FlorbalPercent > 99 ? a.IsFlorbal : true)

                && (IsGame ? a.IsGame : true)

                && (IsTest ? a.IsTest : true)      
                
                && (IsGameSituation1x1        ? a.IsGameSituation1x1        : true) 
                && (IsGameSituation2x2        ? a.IsGameSituation2x2        : true) 
                && (IsGameSituation3x3        ? a.IsGameSituation3x3        : true) 
                && (IsGameSituation4x4        ? a.IsGameSituation4x4        : true) 
                && (IsGameSituation5x5        ? a.IsGameSituation5x5        : true) 
                && (IsGameSituation2x3        ? a.IsGameSituation2x3        : true) 
                && (IsGameSituation2x1        ? a.IsGameSituation2x1        : true) 
                && (IsForGoalman              ? a.IsForGoalman              : true) 
                && (IsForForward              ? a.IsForForward              : true) 
                && (IsForDefender             ? a.IsForDefender             : true) 
                && (IsTrainingPartWarmUp      ? a.IsTrainingPartWarmUp      : true) 
                && (IsTrainingWarmUpExcercise ? a.IsTrainingWarmUpExcercise : true) 
                && (IsTrainingPartDril        ? a.IsTrainingPartDril        : true) 
                && (IsTrainingPartStretching  ? a.IsTrainingPartStretching  : true) 
                && (IsGame                    ? a.IsGame                    : true)   
                && (IsTest                    ? a.IsTest                    : true) 
                && (IsRelay                   ? a.IsRelay                   : true) 
                && (IsShooting                ? a.IsShooting                : true) 
                && (IsPass                    ? a.IsPass                    : true) 
                && (IsBallLeading             ? a.IsBallLeading             : true) 
                && (IsFlexibility             ? a.IsFlexibility             : true) 
                && (IsStrength                ? a.IsStrength                : true) 
                && (IsDynamic                 ? a.IsDynamic                 : true) 
                && (IsReleasing               ? a.IsReleasing               : true) 
                && (IsSpeed                   ? a.IsSpeed                   : true) 
                && (IsPersistence             ? a.IsPersistence             : true) 
                && (IsThinking                ? a.IsThinking                : true) 
                && (IsTeamWork                ? a.IsTeamWork                : true) 
                && (IsFlorballBallsNeeded     ? a.IsFlorballBallsNeeded     : true) 
                && (IsFlorballGateNeeded      ? a.IsFlorballGateNeeded      : true) 
                && (IsResulutionDressNeeded   ? a.IsResulutionDressNeeded   : true) 
                && (IsConeNeeded              ? a.IsConeNeeded              : true) 
                && (IsHurdleNeeded            ? a.IsHurdleNeeded            : true) 
                && (IsJumpingLadderNeeded     ? a.IsJumpingLadderNeeded     : true) 
                && (IsJumpingRopeNeeded       ? a.IsJumpingRopeNeeded       : true)


                
            ).ToList();

            _trainingActivities.Clear();

            while (totalDuration < Duration
                    && filteredActivities.Count() >= selectedActivites.Count()

                    

                    && filteredActivities.Any()
                    )

            {
                int index = random.Next(filteredActivities.Count());

                var selectedActivity = filteredActivities[index];

                var trainingActivity = new TrainingActivity();
                trainingActivity.ActivityId = selectedActivity.ActivityId;

                trainingActivity.Activity = selectedActivity;

                trainingActivity.Order = selectedActivites.Count;
                trainingActivity.DurationMax = selectedActivity.DurationMax.GetValueOrDefault();

                filteredActivities.Remove(selectedActivity);

                if (!selectedActivites.Contains(trainingActivity) && (trainingActivity.DurationMax + totalDuration) <= Duration)
                {
                    totalDuration += trainingActivity.DurationMax;
                    selectedActivites.Add(trainingActivity);
                }
                else
                {
                    triesCount++;

                    continue;
                }
            }

            foreach (var activity in selectedActivites)
            {
                _trainingActivities.Add(activity);
            }
        }
    }
}