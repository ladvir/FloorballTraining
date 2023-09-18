using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments
{
    public class DeleteEquipmentUseCase : IDeleteEquipmentUseCase
    {
        private readonly IEquipmentRepository _equipmentRepository;

        public DeleteEquipmentUseCase(IEquipmentRepository equipmentRepository)
        {
            _equipmentRepository = equipmentRepository;
        }

        public async Task ExecuteAsync(Equipment equipment)
        {
            await _equipmentRepository.DeleteEquipmentAsync(equipment);
        }
    }
}
