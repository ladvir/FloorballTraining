using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class ViewTrainingByIdUseCase(ITrainingRepository repository) : IViewTrainingByIdUseCase
    {
        public async Task<TrainingDto?> ExecuteAsync(int id)
        {
            var item = await repository.GetWithSpecification(new TrainingsSpecification(id));

            return (item ?? throw new Exception($"Nenalezeno{id}")).ToDto();
        }
    }
}



