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
        private int _personsMin;
        private int _personsMax;
        private double _florbalPercent;
        private double _prefferedAktivityRatioMin;
        private string _note;
        private long _ratingSum;
        private long _ratingCount;

        private int _beginTimeMin;
        private int _beginTimeMax;
        private int _warmUpTimeMin;
        private int _warmUpTimeMax;
        private int _warmUpExcerciseTimeMin;
        private int _warmUpExcerciseTimeMax;
        private int _drilTimeMin;
        private int _drilTimeMax;
        private int _stretchingTimeMin;
        private int _stretchingTimeMax;
        private int _endTimeMin;
        private int _endTimeMax;

        private int _blockPauseTimeMin;
        private int _blockPauseTimeMax;
        private int _activityPauseTimeMin;
        private int _activityPauseTimeMax;

        private ObservableCollection<TrainingActivity> _trainingActivities = new ObservableCollection<TrainingActivity>();

        public ICollection<TrainingActivity> TrainingActivities => _trainingActivities;

        public ListView TrainingActivitiesListView;

        private readonly Dictionary<string, List<string>> _propertyNameToErrorsDictionary;

        public int Id
        { get => _id; set { _id = value; OnPropertyChanged(nameof(Id)); ClearErrors(nameof(Id)); OnPropertyChanged(nameof(CanSave)); } }

        public string Name
        { get => _name; set { _name = value; OnPropertyChanged(nameof(Name)); ClearErrors(nameof(Name)); OnPropertyChanged(nameof(CanSave)); } }

        public int Duration
        { get => _duration; set { _duration = value; OnPropertyChanged(nameof(Duration)); ClearErrors(nameof(Duration)); OnPropertyChanged(nameof(CanSave)); } }

        public int PersonsMin
        { get => _personsMin; set { _personsMin = value; OnPropertyChanged(nameof(PersonsMin)); ClearErrors(nameof(PersonsMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int PersonsMax
        { get => _personsMax; set { _personsMax = value; OnPropertyChanged(nameof(PersonsMax)); ClearErrors(nameof(PersonsMax)); OnPropertyChanged(nameof(CanSave)); } }

        public double FlorbalPercent
        { get => _florbalPercent; set { _florbalPercent = value; OnPropertyChanged(nameof(FlorbalPercent)); ClearErrors(nameof(FlorbalPercent)); OnPropertyChanged(nameof(CanSave)); } }

        public double PrefferedAktivityRatioMin
        { get => _prefferedAktivityRatioMin; set { _prefferedAktivityRatioMin = value; OnPropertyChanged(nameof(PrefferedAktivityRatioMin)); ClearErrors(nameof(PrefferedAktivityRatioMin)); OnPropertyChanged(nameof(CanSave)); } }

        public string Note
        { get => _note; set { _note = value; OnPropertyChanged(nameof(Note)); ClearErrors(nameof(Note)); OnPropertyChanged(nameof(CanSave)); } }

        public long RatingSum
        { get => _ratingSum; set { _ratingSum = value; OnPropertyChanged(nameof(RatingSum)); ClearErrors(nameof(RatingSum)); OnPropertyChanged(nameof(CanSave)); } }

        public long RatingCount
        { get => _ratingCount; set { _ratingCount = value; OnPropertyChanged(nameof(RatingCount)); ClearErrors(nameof(RatingCount)); OnPropertyChanged(nameof(CanSave)); } }

        public int BeginTimeMin
        { get => _beginTimeMin; set { _beginTimeMin = value; OnPropertyChanged(nameof(BeginTimeMin)); ClearErrors(nameof(BeginTimeMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int BeginTimeMax
        { get => _beginTimeMax; set { _beginTimeMax = value; OnPropertyChanged(nameof(BeginTimeMax)); ClearErrors(nameof(BeginTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int WarmUpTimeMin
        { get => _warmUpTimeMin; set { _warmUpTimeMin = value; OnPropertyChanged(nameof(WarmUpTimeMin)); ClearErrors(nameof(WarmUpTimeMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int WarmUpTimeMax
        { get => _warmUpTimeMax; set { _warmUpTimeMax = value; OnPropertyChanged(nameof(WarmUpTimeMax)); ClearErrors(nameof(WarmUpTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int WarmUpExcerciseTimeMin
        { get => _warmUpExcerciseTimeMin; set { _warmUpExcerciseTimeMin = value; OnPropertyChanged(nameof(WarmUpExcerciseTimeMin)); ClearErrors(nameof(WarmUpExcerciseTimeMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int WarmUpExcerciseTimeMax
        { get => _warmUpExcerciseTimeMax; set { _warmUpExcerciseTimeMax = value; OnPropertyChanged(nameof(WarmUpExcerciseTimeMax)); ClearErrors(nameof(WarmUpExcerciseTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int DrilTimeMin
        { get => _drilTimeMin; set { _drilTimeMin = value; OnPropertyChanged(nameof(DrilTimeMin)); ClearErrors(nameof(DrilTimeMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int DrilTimeMax
        { get => _drilTimeMax; set { _drilTimeMax = value; OnPropertyChanged(nameof(DrilTimeMax)); ClearErrors(nameof(DrilTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int StretchingTimeMin
        { get => _stretchingTimeMin; set { _stretchingTimeMin = value; OnPropertyChanged(nameof(StretchingTimeMin)); ClearErrors(nameof(StretchingTimeMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int StretchingTimeMax
        { get => _stretchingTimeMax; set { _stretchingTimeMax = value; OnPropertyChanged(nameof(StretchingTimeMax)); ClearErrors(nameof(StretchingTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int EndTimeMin
        { get => _endTimeMin; set { _endTimeMin = value; OnPropertyChanged(nameof(EndTimeMin)); ClearErrors(nameof(EndTimeMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int EndTimeMax
        { get => _endTimeMax; set { _endTimeMax = value; OnPropertyChanged(nameof(EndTimeMax)); ClearErrors(nameof(EndTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int BlockPauseTimeMin
        { get => _blockPauseTimeMin; set { _blockPauseTimeMin = value; OnPropertyChanged(nameof(BlockPauseTimeMin)); ClearErrors(nameof(BlockPauseTimeMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int BlockPauseTimeMax
        { get => _blockPauseTimeMax; set { _blockPauseTimeMax = value; OnPropertyChanged(nameof(BlockPauseTimeMax)); ClearErrors(nameof(BlockPauseTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public int ActivityPauseTimeMin
        { get => _activityPauseTimeMin; set { _activityPauseTimeMin = value; OnPropertyChanged(nameof(ActivityPauseTimeMin)); ClearErrors(nameof(ActivityPauseTimeMin)); OnPropertyChanged(nameof(CanSave)); } }

        public int ActivityPauseTimeMax
        { get => _activityPauseTimeMax; set { _activityPauseTimeMax = value; OnPropertyChanged(nameof(ActivityPauseTimeMax)); ClearErrors(nameof(ActivityPauseTimeMax)); OnPropertyChanged(nameof(CanSave)); } }

        public bool CanSave =>
            HasName &&
            HasPersonsMinGreaterOrEqualToPersonsMax &&
            HasDuration &&
            !HasErrors;

        private bool HasName => !string.IsNullOrEmpty(Name);

        private bool HasPersonsMinGreaterOrEqualToPersonsMax => PersonsMin <= PersonsMax;

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

        public bool CanGenerate =>
            HasPersonsMinGreaterOrEqualToPersonsMax &&
            HasDuration &&
            !HasErrors;

        public event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;

        private TeamStore _teamStore;

        public AddTrainingViewModel(TeamStore teamStore, NavigationService<TrainingListingViewModel> navigationService)
        {
            _trainingActivities = new ObservableCollection<TrainingActivity>();
            _propertyNameToErrorsDictionary = new Dictionary<string, List<string>>();

            _teamStore = teamStore;

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

        public void GetRandomActivities(int totalTurationRequested, int activityDurationMin, int activityDurationMax)
        {
            var random = new Random();

            var totalDuration = 0;

            var selectedActivites = new List<TrainingActivity>();

            var filteredActivities = _teamStore.Activities.Where(a =>
                (a.DurationMin >= activityDurationMin || a.DurationMin == null)
                && (a.DurationMax <= activityDurationMax || a.DurationMax == null)

            ).ToArray();

            _trainingActivities.Clear();

            while (totalDuration < totalTurationRequested && filteredActivities.Count() >= selectedActivites.Count())
            {
                int index = random.Next(filteredActivities.Length);

                var selectedActivity = filteredActivities[index];

                if ((selectedActivity.DurationMin.GetValueOrDefault(0) + totalDuration) > totalTurationRequested)
                {
                    continue;
                }

                totalDuration += selectedActivity.DurationMin.GetValueOrDefault(0);

                var trainingActivity = new TrainingActivity();
                trainingActivity.ActivityId = selectedActivity.ActivityId;
                trainingActivity.Activity = selectedActivity;
                trainingActivity.Order = selectedActivites.Count;
                trainingActivity.DurationMin = selectedActivity.DurationMin ?? activityDurationMin;
                trainingActivity.DurationMax = selectedActivity.DurationMax ?? activityDurationMax;

                if (!selectedActivites.Contains(trainingActivity))
                {
                    selectedActivites.Add(trainingActivity);
                }
                else
                {
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