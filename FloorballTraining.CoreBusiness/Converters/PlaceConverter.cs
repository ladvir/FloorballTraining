using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class PlaceConverter
{
    public static PlaceDto? ToDto(this Place? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new PlaceDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Environment = entity.Environment.ToString(),
            Length = entity.Length,
            Width = entity.Width
        };
    }
}