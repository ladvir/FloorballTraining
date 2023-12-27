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

        public async Task ExecuteAsync(int equipmentId)
        {
            await _equipmentRepository.DeleteEquipmentAsync(equipmentId);
        }
    }
}
