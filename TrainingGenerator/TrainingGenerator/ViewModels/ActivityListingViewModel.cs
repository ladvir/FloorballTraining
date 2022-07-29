using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows.Input;
using TrainingGenerator.Commands;
using TrainingGenerator.Models;
using TrainingGenerator.Services;
using TrainingGenerator.Stores;

namespace TrainingGenerator.ViewModels
{
    public class ActivityListingViewModel : ViewModelBase
    {
        private ObservableCollection<ActivityViewModel> _activities;

        public IEnumerable<ActivityViewModel> Activities => _activities;

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

        public bool HasErrorMessage => !string.IsNullOrEmpty(ErrorMessage);

        public ICommand AddActivityCommand { get; }
        public ICommand LoadActivityCommand { get; }

        public ActivityListingViewModel(TeamStore teamStore, NavigationService<AddActivityViewModel> addActivityNavigationService)
        {
            _activities = new ObservableCollection<ActivityViewModel>();
            AddActivityCommand = new NavigateCommand<AddActivityViewModel>(addActivityNavigationService);
            LoadActivityCommand = new LoadActivityCommand(teamStore, this);

            /*_activities.Add(new ActivityViewModel(new Activity
            {
                Description = "Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka , která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.",
                Duration = 10,
                Name = "Ovečky a vlci",
                PersonsMax = 30,
                PersonsMin = 5,
                Rating = 5
            }));

            _activities.Add(new ActivityViewModel(new Activity
            {
                Description = "Hrajeme florbal dle pravidel. Dbáme na čistou hru bez faulů",
                Duration = 20,
                Name = "Florbal 3x3",
                PersonsMax = 12,
                PersonsMin = 6,
                Rating = 5
            }));

            _activities.Add(new ActivityViewModel(new Activity
            {
                Description = "Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.",
                Duration = 5,
                Name = "Čertovská honička",
                PersonsMax = 20,
                PersonsMin = 5,
                Rating = 5
            }));*/
        }

        public static ActivityListingViewModel LoadViewModel(TeamStore teamStore, NavigationService<AddActivityViewModel> addActivityNavigationService)
        {
            var viewModel = new ActivityListingViewModel(teamStore, addActivityNavigationService);

            viewModel.LoadActivityCommand.Execute(null);

            return viewModel;
        }

        public void UpdateActivities(IEnumerable<Activity> activities)
        {
            _activities.Clear();

            foreach (var activity in activities)
            {
                ActivityViewModel activityViewModel = new ActivityViewModel(activity);

                _activities.Add(activityViewModel);
            }
        }
    }
}