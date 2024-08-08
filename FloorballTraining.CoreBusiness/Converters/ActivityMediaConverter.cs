using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class ActivityMediaConverter
{
    public static ActivityMediaDto? ToDto(this ActivityMedia? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new ActivityMediaDto
        {
            Id = entity.Id,
            MediaType = entity.MediaType,
            Name = entity.Name,
            Data = entity.Data,
            Path = entity.Path,
            Preview = entity.Preview,
            ActivityId = entity.ActivityId
        };
    }
}