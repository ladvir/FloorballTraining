using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class EquipmentEFCoreFactory(IEquipmentRepository repository) : IEquipmentFactory
{
    public async Task<Equipment> GetMergedOrBuild(EquipmentDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new Equipment();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Equipment entity, EquipmentDto dto)
    {
        await Task.Run(() =>
        {
            entity.Id = dto.Id;
            entity.Name = dto.Name;
        });
    }
}