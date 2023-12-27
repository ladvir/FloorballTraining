using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Equipments
{
    public class EditEquipmentUseCase : IEditEquipmentUseCase
    {
        private readonly IEquipmentRepository _equipmentRepository;
        private readonly IEquipmentFactory _equipmentFactory;

        public EditEquipmentUseCase(IEquipmentRepository equipmentRepository, IEquipmentFactory equipmentFactory)
        {
            _equipmentRepository = equipmentRepository;
            _equipmentFactory = equipmentFactory;
        }

        public async Task ExecuteAsync(EquipmentDto equipmentDto)
        {
            var equipment = await _equipmentFactory.GetMergedOrBuild(equipmentDto);

            await _equipmentRepository.UpdateEquipmentAsync(equipment);
        }
    }
}
