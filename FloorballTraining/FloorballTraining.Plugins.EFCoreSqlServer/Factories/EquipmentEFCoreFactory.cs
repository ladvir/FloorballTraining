using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class EquipmentEFCoreFactory : IEquipmentFactory
{
    private readonly IEquipmentRepository _repository;

    public EquipmentEFCoreFactory(IEquipmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<Equipment> GetMergedOrBuild(EquipmentDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new Equipment();

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