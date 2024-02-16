using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class ViewTrainingByIdUseCase : IViewTrainingByIdUseCase
    {
        private readonly ITrainingRepository _repository;

        public ViewTrainingByIdUseCase(ITrainingRepository repository)
        {
            _repository = repository;
        }

        public async Task<TrainingDto?> ExecuteAsync(int id)
        {
            var item = await _repository.GetWithSpecification(new TrainingsSpecification(id));

            return (item ?? throw new Exception($"Nenalezeno{id}")).ToDto();
        }
    }
}



