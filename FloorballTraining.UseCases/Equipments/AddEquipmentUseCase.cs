using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Equipments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Equipments
{
    public class AddEquipmentUseCase(IEquipmentRepository equipmentRepository, IEquipmentFactory equipmentFactory)
        : IAddEquipmentUseCase
    {
        public async Task ExecuteAsync(EquipmentDto equipmentDto)
        {
            var equipment = await equipmentFactory.GetMergedOrBuild(equipmentDto);
            await equipmentRepository.AddEquipmentAsync(equipment);
        }


    }
}
