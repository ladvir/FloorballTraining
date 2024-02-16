using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments;

public class ViewEquipmentByIdUseCase : IViewEquipmentByIdUseCase
{
    private readonly IEquipmentRepository _equipmentRepository;
    private readonly IMapper _mapper;

    public ViewEquipmentByIdUseCase(IEquipmentRepository equipmentRepository, IMapper mapper)
    {
        _equipmentRepository = equipmentRepository;
        _mapper = mapper;
    }

    public async Task<EquipmentDto?> ExecuteAsync(int equipmentId)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(equipmentId);

        return equipment == null ? null : _mapper.Map<Equipment, EquipmentDto>(equipment);
    }
}