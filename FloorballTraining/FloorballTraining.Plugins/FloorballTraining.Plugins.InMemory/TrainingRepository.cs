using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.Plugins.InMemory
{
    public class TrainingRepository : ITrainingRepository
    {

        private readonly List<Training> _trainings = new()
        {
            new Training { TrainingId = 1, Name = "Pondělí", Description = "První trénink", Duration = 90, PersonsMin = 20, PersonsMax = 25},
            new Training { TrainingId = 2, Name = "Středa", Description = "Druhý trénink", Duration = 90, PersonsMin = 15, PersonsMax = 20},
            new Training
            {
                TrainingId = 3, Name = "Čtvrtek", Description = "Třetí trénink", Duration = 5, PersonsMin = 20,PersonsMax = 23,
                TrainingParts = new List<TrainingPart>
                {
                    new TrainingPart
                    {
                        Description = "Descr 1",
                        Name = "1",
                        Duration = 10,
                        TrainingGroups = new List<TrainingGroup>
                        {
                            new TrainingGroup
                            {
                                Name = "G1",
                                TrainingGroupActivities = new List<TrainingGroupActivity>
                                {
                                    new TrainingGroupActivity
                                    {
                                        Activity = new Activity
                                        {
                                            Name = "Test", DurationMax = 200, PersonsMax = 500
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            },

        };


        //todo odebrat nechceme mit vazbu na repo
        public TrainingRepository(ITagRepository tagRepository)
        {
            var tags = tagRepository.GetTagsByNameAsync().GetAwaiter().GetResult().Where(t => t.ParentTagId > 0)
                .ToList();

            foreach (var training in _trainings)
            {

                var index = new Random().Next(tags.Count - 1);
                training.TrainingGoal = tags[index];


                var ageGroups = Enum.GetValues(typeof(AgeGroup)).Cast<AgeGroup>().ToList();
                for (var i = 0; i < new Random().Next(1, ageGroups.Count + 1); i++)
                {
                    index = new Random().Next(ageGroups.Count - 1);
                    training.AddAgeGroup(ageGroups[index]);
                }
            }
        }

        public async Task<IEnumerable<Training>> GetTrainingsByNameAsync(string searchString)
        {
            if (string.IsNullOrWhiteSpace(searchString)) return await Task.FromResult<IEnumerable<Training>>(_trainings);

            return _trainings.Where(a => a.Name.Contains(searchString));
        }

        public Task AddTrainingAsync(Training training)
        {
            if (_trainings.Any(x => x.Name.Equals(training.Name, StringComparison.OrdinalIgnoreCase)))
                return Task.CompletedTask;

            var maxId = _trainings.Max(x => x.TrainingId);
            training.TrainingId = maxId + 1;

            _trainings.Add(training);

            return Task.CompletedTask;
        }

        public async Task<List<string?>> GetEquipmentByTrainingIdAsync(int trainingId)
        {
            var training = await GetTrainingByIdAsync(trainingId);

            return training.TrainingParts.SelectMany(tp => tp.TrainingGroups)
                .SelectMany(tg => tg.TrainingGroupActivities).Select(tga => tga.Activity).AsEnumerable()
                .SelectMany(a => a!.ActivityEquipments).Select(t => t.Equipment?.Name).ToList();
        }

        public async Task<IEnumerable<Training>> GetTrainingsByCriteriaAsync(SearchCriteria criteria)
        {
            var result = _trainings.Select(a => a);

            if (criteria.DurationMin.HasValue)
            {
                result = result.Where(r => r.Duration >= criteria.DurationMin);
            }

            if (criteria.DurationMax.HasValue)
            {
                result = result.Where(r => r.Duration <= criteria.DurationMax);
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
                result = result.Where(r => r.Intesity >= criteria.IntensityMin);
            }

            if (criteria.IntensityMax.HasValue)
            {
                result = result.Where(r => r.Intesity <= criteria.IntensityMax);
            }

            if (!string.IsNullOrEmpty(criteria.Text))
            {
                result = result.Where(r => (!string.IsNullOrEmpty(r.Description) && r.Description.Contains(criteria.Text)) || r.Name.Contains(criteria.Text));
            }

            foreach (var tag in criteria.Tags)
            {
                result = result.Where(r => r.TrainingGoal!.TagId.Equals(tag.TagId));
            }


            //kdyz hledame AgeGroup.Kdokoliv, nemusime filtrovat 
            if (!criteria.AgeGroups.Contains(AgeGroup.Kdokoliv))
            {
                foreach (var ageGroup in criteria.AgeGroups)
                {
                    result = result.Where(r => r.TrainingAgeGroups.Any(t => t.AgeGroup == ageGroup || t.AgeGroup == AgeGroup.Kdokoliv));
                }
            }



            return await Task.FromResult(result);
        }

        public async Task<Training> GetTrainingByIdAsync(int trainingId)
        {
            var existingTraining = _trainings.FirstOrDefault(a => a.TrainingId == trainingId) ?? new Training();

            return await Task.FromResult(existingTraining);
        }



        public Task UpdateTrainingAsync(Training training)
        {
            var existingTraining = (_trainings.FirstOrDefault(a => a.TrainingId == training.TrainingId) ?? new Training())
                                   ?? throw new Exception("Trénink nenalezen");
            existingTraining.Merge(training);

            return Task.CompletedTask;
        }


    }
}