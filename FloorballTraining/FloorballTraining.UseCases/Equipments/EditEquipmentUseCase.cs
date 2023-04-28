using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments
{
    public class EditEquipmentUseCase : IEditEquipmentUseCase
    {
        private readonly IEquipmentRepository _equipmentRepository;

        public EditEquipmentUseCase(IEquipmentRepository equipmentRepository)
        {
            _equipmentRepository = equipmentRepository;
        }

        public async Task ExecuteAsync(Equipment equipment)
        {
            await _equipmentRepository.UpdateEquipmentAsync(equipment);
        }
    }
}
