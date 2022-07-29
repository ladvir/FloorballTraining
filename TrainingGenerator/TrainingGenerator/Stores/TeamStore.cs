using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Models;

namespace TrainingGenerator.Stores
{
    public class TeamStore
    {
        private readonly List<Activity> _activities;
        private readonly Team _team;
        private Lazy<Task> _initializeLazy;

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

        public IEnumerable<Activity> Activities => _activities;

        public async Task Load()
        {
            try
            {
                await _initializeLazy.Value;
            }
            catch (Exception ex)
            {
                _initializeLazy = new Lazy<Task>();
            }
        }

        public async Task AddActivity(Activity activity)
        {
            await _team.AddActivity(activity);
            _activities.Add(activity);
        }
    }
}