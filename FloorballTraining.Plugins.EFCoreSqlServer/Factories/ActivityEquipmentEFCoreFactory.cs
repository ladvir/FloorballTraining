using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class ActivityEquipmentEFCoreFactory(IActivityEquipmentRepository repository, IEquipmentFactory equipmentFactory)
    : IActivityEquipmentFactory
{
    public async Task<ActivityEquipment> GetMergedOrBuild(ActivityEquipmentDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new ActivityEquipment();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(ActivityEquipment entity, ActivityEquipmentDto dto)
    {

        entity.EquipmentId = dto.Id;
        entity.Equipment = await equipmentFactory.GetMergedOrBuild(dto.Equipment!);
        entity.ActivityId = entity.ActivityId;
    }
}

