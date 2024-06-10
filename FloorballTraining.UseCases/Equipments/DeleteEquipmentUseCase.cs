using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments
{
    public class DeleteEquipmentUseCase(IEquipmentRepository equipmentRepository) : IDeleteEquipmentUseCase
    {
        public async Task ExecuteAsync(int equipmentId)
        {
            await equipmentRepository.DeleteEquipmentAsync(equipmentId);
        }
    }
}
