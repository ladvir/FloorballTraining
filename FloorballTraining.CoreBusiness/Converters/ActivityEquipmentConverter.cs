using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class ActivityEquipmentConverter
{
    public static ActivityEquipmentDto? ToDto(this ActivityEquipment? entity)
    {
        if (entity == null) return null;

        return new ActivityEquipmentDto
        {
            Id = entity.Id,
            Equipment = entity.Equipment.ToDto(),
            EquipmentId = entity.Equipment!.Id,
            //Activity = entity.Activity.ToDto(),
            ActivityId = entity.ActivityId
        };
    }
}