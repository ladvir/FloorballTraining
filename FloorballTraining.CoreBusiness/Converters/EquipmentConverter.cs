using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class EquipmentConverter
{
    public static EquipmentDto? ToDto(this Equipment? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));
        return new EquipmentDto
        {
            Id = entity.Id,
            Name = entity.Name
        };
    }
}