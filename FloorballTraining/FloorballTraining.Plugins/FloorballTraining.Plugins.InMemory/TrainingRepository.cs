using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;


namespace FloorballTraining.Plugins.InMemory
{
    public class TrainingRepository : ITrainingRepository
    {

        private readonly List<Training> _trainings = new()
        {
            new Training { TrainingId = 1, Name = "Pondělí", Description = "První trénink", Duration = 90, Persons = 20 },
            new Training { TrainingId = 2, Name = "Středa", Description = "Druhý trénink", Duration = 90, Persons = 26 },
            new Training { TrainingId = 3, Name = "Čtvrtek", Description = "Třetí trénink", Duration = 60, Persons = 22 },

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

        public async Task<Training> GetTrainingByIdAsync(int trainingId)
        {
            var existingTraining = _trainings.FirstOrDefault(a => a.TrainingId == trainingId) ?? new Training();

            return await Task.FromResult(existingTraining.Clone());
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