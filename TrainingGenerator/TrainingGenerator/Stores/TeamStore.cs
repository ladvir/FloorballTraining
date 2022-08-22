using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Models;

namespace TrainingGenerator.Stores
{
    public class TeamStore
    {
        private readonly List<Activity> _activities;
        private readonly List<Training> _trainings;

        private Activity _selectedActivity;
        private Training _selectedTraining;

        private readonly Team _team;
        private Lazy<Task> _initializeActivitiesLazy;

        private Lazy<Task> _initializeTrainingsLazy;

        public IEnumerable<Activity> Activities => _activities;
        public IEnumerable<Training> Trainings => _trainings;

        public Activity SelectedActivity
        {
            get => _selectedActivity;
            set
            {
                _selectedActivity = value;
            }
        }

        public Training SelectedTraining
        {
            get => _selectedTraining;
            set
            {
                _selectedTraining = value;
            }
        }

        public TeamStore(Team team)
        {
            _activities = new List<Activity>();
            _trainings = new List<Training>();
            _team = team;

            _initializeActivitiesLazy = new Lazy<Task>(InitializeActivites);

            _initializeTrainingsLazy = new Lazy<Task>(InitializeTrainings);
        }

        private async Task InitializeActivites()
        {
            IEnumerable<Activity> activities = await _team.GetActivities();

            _activities.Clear();
            _activities.AddRange(activities);
        }

        private async Task InitializeTrainings()
        {
            IEnumerable<Training> trainings = await _team.GetTrainings();

            _trainings.Clear();
            _trainings.AddRange(trainings);
        }

        public async Task LoadActivities()
        {
            try
            {
                await _initializeActivitiesLazy.Value;
            }
            catch
            {
                _initializeActivitiesLazy = new Lazy<Task>();
            }
        }

        public async Task LoadTrainings()
        {
            try
            {
                await _initializeTrainingsLazy.Value;
            }
            catch
            {
                _initializeTrainingsLazy = new Lazy<Task>();
            }
        }

        public async Task<Activity> GetActivity(int id)
        {
            return await _team.GetActivity(id);
        }

        public async Task AddActivity(Activity activity)
        {
            Activity justInsertedActivity = await _team.AddActivity(activity);

            _activities.Add(justInsertedActivity);
        }

        public async Task UpdateActivity(Activity activity)
        {
            await _team.UpdateActivity(activity);

            await InitializeActivites();
        }

        public async Task DeleteActivity(Activity activity)
        {
            await _team.DeleteActivity(activity);

            await InitializeActivites();
        }
    }
}