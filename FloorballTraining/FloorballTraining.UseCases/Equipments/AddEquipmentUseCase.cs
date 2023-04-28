using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments
{
    public class AddEquipmentUseCase : IAddEquipmentUseCase
    {
        private readonly IEquipmentRepository _equipmentRepository;

        public AddEquipmentUseCase(IEquipmentRepository equipmentRepository)
        {
            _equipmentRepository = equipmentRepository;
        }

        public async Task ExecuteAsync(Equipment equipment)
        {
            await _equipmentRepository.AddEquipmentAsync(equipment);
        }
    }
}
