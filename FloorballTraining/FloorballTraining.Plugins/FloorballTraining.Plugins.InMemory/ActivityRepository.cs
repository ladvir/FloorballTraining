﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;


namespace FloorballTraining.Plugins.InMemory
{
    public class ActivityRepository : IActivityRepository
    {
        private readonly List<Activity> _activities = new()
        {
            new Activity { ActivityId = 1, Name = "Dračí zápasy", Description = @"Děti se rozdělí do dvou družstev, děti se drží za pas, první v řadě je hlava draka, poslední je ocas draka, družstva stojí asi 10 metrů od sebe, na povel se snaží hlava draka chytit ocas draka protihráče", DurationMin  = 5, DurationMax = 10 , PersonsMin = 4 },
            new Activity { ActivityId = 2, Name = "Čertovská honička",  Description = @"Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.",  DurationMin = 5, DurationMax= 15 , PersonsMin = 5 },
            new Activity { ActivityId = 3, Name = "Florbal 3x3",  DurationMin = 10, DurationMax = 20 , PersonsMin = 6 , PersonsMax = 12},
            new Activity { ActivityId = 4, Name = "Na ovečky a vlky s florbalkou a míčkem",  Description = @"Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka, která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.", DurationMin = 5,  DurationMax = 15 , PersonsMin = 5 }
        };

        //todo odebrat nechceme mit vazbu na repo
        public ActivityRepository(ITagRepository tagRepository, IEquipmentRepository equipmentRepository)
        {
            var tags = tagRepository.GetTagsByNameAsync().GetAwaiter().GetResult().Where(t => t.ParentTagId > 0).ToList();

            var equipments = equipmentRepository.GetEquipmentsByNameAsync().GetAwaiter().GetResult().ToList();


            foreach (var activity in _activities)
            {
                for (var i = 0; i < new Random().Next(1, tags.Count); i++)
                {
                    var index = new Random().Next(tags.Count - 1);
                    activity.AddTag(tags[index]);
                }


                for (var i = 0; i < new Random().Next(1, equipments.Count + 1); i++)
                {
                    var index = new Random().Next(equipments.Count - 1);
                    activity.AddEquipment(equipments[index]);
                }

                var ageGroups = Enum.GetValues(typeof(AgeGroup)).Cast<AgeGroup>().ToList();
                for (var i = 0; i < new Random().Next(1, ageGroups.Count + 1); i++)
                {
                    var index = new Random().Next(ageGroups.Count - 1);
                    activity.AddAgeGroup(ageGroups[index]);
                }



            }
        }

        public async Task<IEnumerable<Activity>> GetActivitiesByNameAsync(string searchString)
        {
            if (string.IsNullOrWhiteSpace(searchString)) return await Task.FromResult<IEnumerable<Activity>>(_activities);

            return _activities.Where(a => a.Name.Contains(searchString));
        }

        public Task AddActivityAsync(Activity activity)
        {
            if (_activities.Any(x => x.Name.Equals(activity.Name, StringComparison.OrdinalIgnoreCase)))
                return Task.CompletedTask;

            var maxId = _activities.Max(x => x.ActivityId);
            activity.ActivityId = maxId + 1;

            _activities.Add(activity);

            return Task.CompletedTask;
        }

        public async Task<Activity> GetActivityByIdAsync(int activityId)
        {
            var existingActivity = _activities.FirstOrDefault(a => a.ActivityId == activityId);

            if (existingActivity == null)
            {
                throw new Exception("Aktivita nenalezena");
            }

            return await Task.FromResult(existingActivity.Clone());
        }

        public async Task<Activity> CloneActivityAsync(Activity activity)
        {
            var clone = activity.Clone();
            clone.Name = string.Concat(clone.Name, " - kopie");

            await AddActivityAsync(clone);

            return clone;
        }

        public Task DeleteActivityAsync(Activity activity)
        {
            _activities.RemoveAll(a => a.ActivityId == activity.ActivityId);
            activity = new Activity();

            return Task.CompletedTask;
        }

        public async Task<int?> GetActivityNextByIdAsync(int activityId)
        {
            var existingActivity = _activities.OrderBy(o => o.ActivityId).FirstOrDefault(a => a.ActivityId > activityId);
            return await Task.FromResult(existingActivity?.ActivityId);
        }

        public async Task<int?> GetActivityPrevByIdAsync(int activityId)
        {
            var existingActivity = _activities.OrderByDescending(o => o.ActivityId).FirstOrDefault(a => a.ActivityId < activityId);
            return await Task.FromResult(existingActivity?.ActivityId);
        }

        public Task UpdateActivityAsync(Activity activity)
        {
            var existingActivity = _activities.FirstOrDefault(a => a.ActivityId == activity.ActivityId);
            if (existingActivity != null)
            {
                existingActivity.Merge(activity);

                return Task.CompletedTask;
            }

            throw new Exception("Aktivita nenalezena");
        }


    }
}