using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Equipments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Equipments
{
    public class EditEquipmentUseCase(IEquipmentRepository equipmentRepository, IEquipmentFactory equipmentFactory)
        : IEditEquipmentUseCase
    {
        public async Task ExecuteAsync(EquipmentDto equipmentDto)
        {
            var equipment = await equipmentFactory.GetMergedOrBuild(equipmentDto);

            await equipmentRepository.UpdateEquipmentAsync(equipment);
        }
    }
}
