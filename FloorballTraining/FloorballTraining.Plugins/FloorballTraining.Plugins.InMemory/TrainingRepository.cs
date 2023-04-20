using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;


namespace FloorballTraining.Plugins.InMemory
{
    public class TrainingRepository : ITrainingRepository
    {

        private List<Training> _trainings = new()
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


            var x = training.TrainingParts.SelectMany(tp => tp.TrainingGroups)
                .SelectMany(tg => tg.TrainingGroupActivities).Select(tga => tga.Activity).AsEnumerable()
                .SelectMany(a => a.ActivityTags).Where(t => t.Tag?.ParentTag?.Name == "Vybavení").Select(t => t.Tag?.Name);

            return x.ToList();
        }

        public async Task<Training> GetTrainingByIdAsync(int trainingId)
        {
            var existingTraining = _trainings.FirstOrDefault(a => a.TrainingId == trainingId) ?? new Training();

            return await Task.FromResult(existingTraining);
        }



        public Task UpdateTrainingAsync(Training training)
        {
            var existingTraining = _trainings.FirstOrDefault(a => a.TrainingId == training.TrainingId) ?? new Training();
            if (existingTraining == null)
            {
                throw new Exception("Aktivita nenalezena");
            }

            existingTraining.Merge(training);

            return Task.CompletedTask;
        }


    }
}