﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;


namespace FloorballTraining.Plugins.InMemory
{
    public class ActivityRepository : IActivityRepository
    {
        private readonly List<Activity> _activities = new()
        {
            new Activity { ActivityId = 1, Name = "Dračí zápasy", Description = @"Děti se rozdělí do dvou družstev, děti se drží za pas, první v řadě je hlava draka, poslední je ocas draka, družstva stojí asi 10 metrů od sebe, na povel se snaží hlava draka chytit ocas draka protihráče", DurationMin  = 5, DurationMax = 10 , PersonsMin = 4, Difficulty = Difficulties.Low, Intensity = Intensities.Low},
            new Activity { ActivityId = 2, Name = "Čertovská honička",  Description = @"Čert má z rozlišováku připevněný ocas a snaží se všechny ostatní hráče polapit. Pokud někoho chytne, jde mimo hřiště.Hráči se snaží vzít čertovy ocas a osvobodit tak již chycené hráče. Po osvobození hráčů hra končí a stává se čertem hráč, který vzal čertovy ocas.",  DurationMin = 5, DurationMax= 15 , PersonsMin = 5, Difficulty = Difficulties.Low, Intensity = Intensities.Medium },
            new Activity { ActivityId = 3, Name = "Florbal 3x3",  DurationMin = 10, DurationMax = 20 , PersonsMin = 6 , PersonsMax = 12, Difficulty = Difficulties.High, Intensity = Intensities.High},
            new Activity { ActivityId = 4, Name = "Na ovečky a vlky s florbalkou a míčkem",  Description = @"Všichni mají florbalky. Každá ovečka má míček. Vlk se postaví do základní pozice na druhé straně hřiště. Po zahájení hry se saží chytit ovečku tak, že ji vezme florbalově čistě míček. Nesmí se vracet ve směru pohybu. Ovečka, která přišla o míček se stává vlkem, Po chycení všech oveček hra končí.", DurationMin = 5,  DurationMax = 15 , PersonsMin = 15, Difficulty = Difficulties.Low, Intensity = Intensities.Medium },
            new Activity { ActivityId = 5, Name = "Florbal 1x1",  DurationMin = 5, DurationMax = 10 , PersonsMin = 2 , PersonsMax = 10, Difficulty = Difficulties.High, Intensity = Intensities.High},
            new Activity { ActivityId = 6, Name = "Florbal 2x2",  DurationMin = 10, DurationMax = 20 , PersonsMin = 4 , PersonsMax = 10, Difficulty = Difficulties.High, Intensity = Intensities.High},
            new Activity { ActivityId = 7, Name = "Florbal 5x5",  DurationMin = 10, DurationMax = 20 , PersonsMin = 10 , PersonsMax = 30, Difficulty = Difficulties.High, Intensity = Intensities.High},
        new Activity { ActivityId = 8, Name = "A8",  DurationMin = 10, DurationMax = 20 , PersonsMin = 6 , PersonsMax = 12, Difficulty = Difficulties.High, Intensity = Intensities.High},
        new Activity { ActivityId = 9, Name = "Aktivita 9",  DurationMin = 10, DurationMax = 20 , PersonsMin = 6 , PersonsMax = 12, Difficulty = Difficulties.High, Intensity = Intensities.High},
        new Activity { ActivityId = 10, Name = "Aktivita 10",  DurationMin = 10, DurationMax = 20 , PersonsMin = 6 , PersonsMax = 12, Difficulty = Difficulties.Low, Intensity = Intensities.Low},
        new Activity { ActivityId = 11, Name = "Test 1",  DurationMin = 10, DurationMax = 20 , PersonsMin = 6 , PersonsMax = 12, Difficulty = Difficulties.High, Intensity = Intensities.Medium},
        new Activity { ActivityId = 12, Name = "Test 2",  DurationMin = 20, DurationMax = 20 , PersonsMin = 14 , PersonsMax = 16, Difficulty = Difficulties.Low, Intensity = Intensities.High}

        };

        //todo odebrat nechceme mit vazbu na repo
        public ActivityRepository(ITagRepository tagRepository, IEquipmentRepository equipmentRepository, IAgeGroupRepository ageGroupRepository)
        {
            var tags = tagRepository.GetTagsByNameAsync().GetAwaiter().GetResult().Where(t => t.ParentTagId > 0).ToList();

            var equipments = equipmentRepository.GetEquipmentsByNameAsync().GetAwaiter().GetResult().ToList();

            var ageGroups = ageGroupRepository.GetAgeGroupsByNameAsync().GetAwaiter().GetResult().ToList();

            foreach (var activity in _activities)
            {
                if (activity.PersonsMax < activity.PersonsMin)
                {
                    activity.PersonsMax = activity.PersonsMin * 4;
                }



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

                for (var i = 0; i < new Random().Next(1, ageGroups.Count + 1); i++)
                {
                    var index = new Random().Next(ageGroups.Count - 1);
                    activity.AddAgeGroup(ageGroups[index]);
                }

                if (activity.ActivityId > 2)
                {
                    activity.AddMedia(new ActivityMedia
                    {
                        Data =
                            @"{""attrs"":{""width"":3278,""height"":1399},""className"":""Stage"",""children"":[{""attrs"":{""name"":""backgroundLayer""},""className"":""Layer"",""children"":[{""attrs"":{""width"":2731.045340050378,""height"":1399,""id"":""background"",""name"":""BlankHorizontalSvg"",""x"":273.477329974811},""className"":""Image""}]},{""attrs"":{""name"":""drawingLayer""},""className"":""Layer"",""children"":[{""attrs"":{""name"":""transformer""},""className"":""Transformer""},{""attrs"":{""fill"":""rgba(0,0,255,0.5)"",""name"":""selectionRectangle"",""visible"":false},""className"":""Rect""},{""attrs"":{""points"":[1189.007778716873,269.70878905220655,1265.0080730571678,784.711125762572],""stroke"":""#000000"",""strokeWidth"":1,""lineCap"":""round"",""lineJoin"":""round"",""draggable"":true,""name"":""line""},""className"":""Line""},{""attrs"":{""points"":[2468.0127321542045,234.70863024664772,2225.0117910398403,868.7115068959132],""stroke"":""#000000"",""strokeWidth"":1,""lineCap"":""round"",""lineJoin"":""round"",""draggable"":true,""name"":""line""},""className"":""Line""},{""attrs"":{""x"":1524.0090761379097,""y"":105.7080449347309,""stroke"":""#000000"",""strokeWidth"":1,""draggable"":true,""name"":""circle"",""radius"":46.00017815333649},""className"":""Circle""},{""attrs"":{""x"":1723.0098468447345,""y"":623.7103952570014,""stroke"":""#000000"",""strokeWidth"":1,""draggable"":true,""name"":""circle"",""radius"":29.000112314059834},""className"":""Circle""},{""attrs"":{""x"":1886.0104781272091,""y"":913.7117110744889,""stroke"":""#000000"",""strokeWidth"":1,""draggable"":true,""name"":""circle"",""radius"":69.00026723000474},""className"":""Circle""},{""attrs"":{""x"":2053.0111249012784,""y"":183.708398844262,""stroke"":""#000000"",""strokeWidth"":1,""draggable"":true,""name"":""circle"",""radius"":21.00008133087067},""className"":""Circle""},{""attrs"":{""x"":843.0064386939513,""y"":519.7099233776268,""stroke"":""#000000"",""strokeWidth"":1,""draggable"":true,""name"":""circle"",""radius"":159.00061579088015},""className"":""Circle""}]}]}",
                        MediaType = MediaType.Image,
                        Name = "Drawing " + activity.ActivityId
                    });
                }

                var actind = new Random().Next(_activities.Count - 1);


                if (actind % 3 == 0)
                {
                    activity.AddMedia(new ActivityMedia
                    {
                        Path = "https://www.seznam.cz",
                        MediaType = MediaType.URL,
                        Name = "www.seznam.cz"
                    });
                }

                if (actind % 7 == 0)
                {
                    activity.AddMedia(new ActivityMedia
                    {
                        Path = "https://www.idnes.cz",
                        MediaType = MediaType.URL,
                        Name = "idnes"
                    });

                }
            }
        }

        public async Task<IEnumerable<Activity>> GetActivitiesByNameAsync(string searchString)
        {
            if (string.IsNullOrWhiteSpace(searchString)) return await Task.FromResult<IEnumerable<Activity>>(_activities);

            return await Task.FromResult(_activities.Where(a => a.Name.Contains(searchString)));
        }

        public async Task<IEnumerable<Activity>> GetActivitiesByCriteriaAsync(SearchCriteria criteria)
        {
            var result = _activities.Select(a => a);

            if (criteria.DurationMin.HasValue)
            {
                result = result.Where(r => r.DurationMax >= criteria.DurationMin);
            }

            if (criteria.DurationMax.HasValue)
            {
                result = result.Where(r => r.DurationMin <= criteria.DurationMax);
            }

            if (criteria.PersonsMin.HasValue)
            {
                result = result.Where(r => r.PersonsMax >= criteria.PersonsMin);
            }

            if (criteria.PersonsMax.HasValue)
            {
                result = result.Where(r => r.PersonsMin <= criteria.PersonsMax);
            }

            if (criteria.DifficultyMin.HasValue)
            {
                result = result.Where(r => r.Difficulty >= criteria.DifficultyMin);
            }

            if (criteria.DifficultyMax.HasValue)
            {
                result = result.Where(r => r.Difficulty <= criteria.DifficultyMax);
            }

            if (criteria.IntensityMin.HasValue)
            {
                result = result.Where(r => r.Intensity >= criteria.IntensityMin);
            }

            if (criteria.IntensityMax.HasValue)
            {
                result = result.Where(r => r.Intensity <= criteria.IntensityMax);
            }

            if (!string.IsNullOrEmpty(criteria.Text))
            {
                result = result.Where(r => (!string.IsNullOrEmpty(r.Description) && r.Description.Contains(criteria.Text)) || r.Name.Contains(criteria.Text));
            }

            foreach (var tag in criteria.Tags)
            {
                result = result.Where(r => r.ActivityTags.Any(t => t.TagId == tag.TagId));
            }


            //kdyz hledame AgeGroup.Kdokoliv, nemusime filtrovat 
            if (criteria.AgeGroups.All(ag => ag.Name != AgeGroup.Kdokoliv))
            {
                foreach (var ageGroup in criteria.AgeGroups)
                {
                    result = result.Where(r => r.ActivityAgeGroups.Any(t => t.AgeGroup == ageGroup || t.AgeGroup!.IsKdokoliv()));
                }
            }



            return await Task.FromResult(result);
        }

        public IEnumerable<Activity> GetActivitiesByCriteria(SearchCriteria criteria)
        {
            throw new NotImplementedException();
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

            return existingActivity == null ? throw new Exception("Aktivita nenalezena") : await Task.FromResult(existingActivity.Clone());
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