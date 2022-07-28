using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class AddActivityViewModel : ViewModelBase
    {
        private string _name;

        private string _description;

        private int? _duration;

        private int? _personsMin;

        private int? _personsMax;

        public string Name
        {
            get => _name;
            set
            {
                _name = value;
                OnPropertyChanged(nameof(Name));
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
            }
        }

        public int? Duration
        {
            get => _duration; set
            {
                _duration = value;
                OnPropertyChanged(nameof(Duration));
            }
        }

        public int? PersonsMin
        {
            get => _personsMin; set
            {
                _personsMin = value;
                OnPropertyChanged(nameof(PersonsMin));
            }
        }

        public int? PersonsMax
        {
            get => _personsMax; set
            {
                _personsMax = value;
                OnPropertyChanged(nameof(PersonsMax));
            }
        }

        public ICommand SaveCommand { get; }
        public ICommand CancelCommand { get; }

        public AddActivityViewModel(TeamStore teamStore, NavigationService navigationService)
        {
            SaveCommand = new AddActivityCommand(teamStore, this, navigationService);
            CancelCommand = new NavigateCommand(navigationService);
        }
    }
}