using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityByIdUseCase : IViewActivityByIdUseCase
    {
        private readonly IActivityRepository _repository;
        private readonly IMapper _mapper;

        public ViewActivityByIdUseCase(IActivityRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<ActivityDto> ExecuteAsync(int id)
        {
            var tag = await _repository.GetByIdAsync(id);

            return _mapper.Map<Activity?, ActivityDto>(tag);
        }
    }
}
