using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityByIdUseCase : IViewActivityByIdUseCase
    {
        private readonly IActivityRepository _repository;

        public ViewActivityByIdUseCase(IActivityRepository repository)
        {
            _repository = repository;
        }

        public async Task<ActivityDto?> ExecuteAsync(int id)
        {
            var item = await _repository.GetActivityByIdAsync(id);

            return (item ?? throw new Exception($"Nenalezeno{id}")).ToDto();
        }
    }
}
