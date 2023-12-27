using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places
{
    public class EditPlaceUseCase : IEditPlaceUseCase
    {
        private readonly IPlaceRepository _placeRepository;
        private readonly IMapper _mapper;

        public EditPlaceUseCase(IPlaceRepository placeRepository, IMapper mapper)
        {
            _placeRepository = placeRepository;
            _mapper = mapper;
        }

        public async Task ExecuteAsync(PlaceDto placeDto)
        {
            var place = _mapper.Map<PlaceDto, Place>(placeDto);

            await _placeRepository.UpdatePlaceAsync(place);
        }
    }
}
