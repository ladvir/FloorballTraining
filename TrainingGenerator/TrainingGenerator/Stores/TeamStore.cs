using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Models;

namespace TrainingGenerator.Stores
{
    public class TeamStore
    {
        private readonly List<Activity> _activities;
        private Activity _selectedActivity;
        private readonly Team _team;
        private Lazy<Task> _initializeLazy;

        public IEnumerable<Activity> Activities => _activities;

        public Activity SelectedActivity
        {
            get => _selectedActivity;
            set
            {
                _selectedActivity = value;
            }
        }

        public TeamStore(Team team)
        {
            _activities = new List<Activity>();
            _team = team;

            _initializeLazy = new Lazy<Task>(Initialize);
        }

        private async Task Initialize()
        {
            IEnumerable<Activity> activities = await _team.GetActivities();

            _activities.Clear();
            _activities.AddRange(activities);
        }

        public async Task Load()
        {
            try
            {
                await _initializeLazy.Value;
            }
            catch
            {
                _initializeLazy = new Lazy<Task>();
            }
        }

        public async Task<Activity> GetActivity(int id)
        {
            return await _team.GetActivity(id);
        }

        public async Task AddActivity(Activity activity)
        {
            await _team.AddActivity(activity);
            _activities.Add(activity);
        }

        public async Task UpdateActivity(Activity activity)
        {
            await _team.UpdateActivity(activity);

            await Initialize();
        }

        public async Task DeleteActivity(Activity activity)
        {
            await _team.DeleteActivity(activity);

            await Initialize();
        }
    }
}