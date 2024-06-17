using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityByIdUseCase(IActivityRepository repository) : IViewActivityByIdUseCase
    {
        public async Task<ActivityDto?> ExecuteAsync(int id)
        {
            var item = await repository.GetActivityByIdAsync(id);

            return item.ToDto();
        }
    }
}
