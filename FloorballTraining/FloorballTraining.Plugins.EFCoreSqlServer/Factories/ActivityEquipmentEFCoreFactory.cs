using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class ActivityEquipmentEFCoreFactory : IActivityEquipmentFactory
{
    private readonly IActivityEquipmentRepository _repository;
    private readonly IEquipmentFactory _equipmentFactory;


    public ActivityEquipmentEFCoreFactory(IActivityEquipmentRepository repository, IEquipmentFactory equipmentFactory)
    {
        _repository = repository;
        _equipmentFactory = equipmentFactory;
    }

    public async Task<ActivityEquipment> GetMergedOrBuild(EquipmentDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new ActivityEquipment();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(ActivityEquipment entity, EquipmentDto dto)
    {

        entity.EquipmentId = dto.Id;
        entity.Equipment = await _equipmentFactory.GetMergedOrBuild(dto);
        entity.ActivityId = entity.ActivityId;
    }
}