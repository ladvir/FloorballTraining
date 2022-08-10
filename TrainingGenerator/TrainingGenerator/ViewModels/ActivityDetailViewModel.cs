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
        private int _duration = 5;
        private int _personsMin = 5;
        private int _personsMax = 15;

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
                    AddError("Zadej, jak dlouho trvá aktivita ", nameof(Duration));
                }

                OnPropertyChanged(nameof(CanUpdateActivity));
            }
        }

        public int PersonsMin
        {
            get => _personsMin;
            set
            {
                _personsMin = value;
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

        public bool CanUpdateActivity =>
            HasName &&
            HasDescription &&
            HasPersonsMinGreaterOrEqualToPersonsMax &&
            HasDuration &&
            !HasErrors;

        private bool HasName => !string.IsNullOrEmpty(Name);
        private bool HasDescription => !string.IsNullOrEmpty(Description);
        private bool HasPersonsMinGreaterOrEqualToPersonsMax => PersonsMin <= PersonsMax;

        private bool HasDuration => Duration > 0;

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

        public ICommand OpenActivityCommand { get; }

        public bool HasErrors => _propertyNameToErrorsDictionary.Any();

        public event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;

        public ActivityDetailViewModel(
        TeamStore teamStore,
        NavigationService<ActivityListingViewModel> navigationService)
        {
            SaveCommand = new UpdateActivityCommand(teamStore, this, navigationService);
            DeleteCommand = new DeleteActivityCommand(teamStore, this, navigationService);

            CancelCommand = new NavigateCommand<ActivityListingViewModel>(navigationService);

            OpenActivityCommand = new OpenActivityCommand(teamStore, this);

            _propertyNameToErrorsDictionary = new Dictionary<string, List<string>>();
        }

        public static ActivityDetailViewModel LoadViewModel(TeamStore teamStore, NavigationService<ActivityListingViewModel> activityListingNavigationService)
        {
            var viewModel = new ActivityDetailViewModel(teamStore, activityListingNavigationService);

            viewModel.OpenActivityCommand.Execute(teamStore.SelectedActivity);

            return viewModel;
        }

        public void OpenActivity(Activity activity)
        {
            _id = activity.Id;

            Name = activity.Name;
            Description = activity.Description;
            PersonsMax = activity.PersonsMax.GetValueOrDefault();
            PersonsMin = activity.PersonsMin.GetValueOrDefault();
            Duration = activity.Duration.GetValueOrDefault();
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