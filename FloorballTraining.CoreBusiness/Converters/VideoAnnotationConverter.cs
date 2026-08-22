using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class VideoAnnotationConverter
{
    public static VideoAnnotationDto ToDto(this VideoAnnotation entity) => new()
    {
        Id = entity.Id,
        VideoId = entity.VideoId,
        TrimStartMs = entity.TrimStartMs,
        TrimEndMs = entity.TrimEndMs,
        DataJson = entity.DataJson,
        UpdatedAt = entity.UpdatedAt,
    };
}
