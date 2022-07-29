using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class AddActivityViewModel : ViewModelBase, INotifyDataErrorInfo
    {
        private string _name;

        private string _description;

        private int _duration = 5;

        private int _personsMin = 5;

        private int _personsMax = 15;

        private readonly Dictionary<string, List<string>> _propertyNameToErrorsDictionary;

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

                OnPropertyChanged(nameof(CanCreateActivity));
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

                OnPropertyChanged(nameof(CanCreateActivity));
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

                OnPropertyChanged(nameof(CanCreateActivity));
            }
        }

        public int PersonsMin
        {
            get => _personsMin; set
            {
                _personsMin = value;
                OnPropertyChanged(nameof(PersonsMin));

                ClearErrors(nameof(PersonsMax));
                ClearErrors(nameof(PersonsMin));

                if (!HasPersonsMinGreaterOrEqualToPersonsMax)
                {
                    AddError("Minimální počet osob nesmí být větší než maximální počet osob.", nameof(PersonsMin));
                }

                OnPropertyChanged(nameof(CanCreateActivity));
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

                OnPropertyChanged(nameof(CanCreateActivity));
            }
        }

        public bool CanCreateActivity =>
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

        public bool HasErrors => _propertyNameToErrorsDictionary.Any();

        public event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;

        public AddActivityViewModel(TeamStore teamStore, NavigationService<ActivityListingViewModel> navigationService)
        {
            SaveCommand = new AddActivityCommand(teamStore, this, navigationService);
            CancelCommand = new NavigateCommand<ActivityListingViewModel>(navigationService);

            _propertyNameToErrorsDictionary = new Dictionary<string, List<string>>();
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

            if (HasErrors) {
                SubmitErrorMessage = string.Join("\n", GetErrors().Cast<string>());
            } else {
                SubmitErrorMessage = string.Empty;
            }

        }
    }
}