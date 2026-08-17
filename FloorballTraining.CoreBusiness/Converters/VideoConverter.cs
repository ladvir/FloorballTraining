using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class VideoConverter
{
    public static VideoDto ToDto(this Video entity) => new()
    {
        Id = entity.Id,
        VideoType = entity.VideoType,
        Url = entity.Url,
        FilePath = entity.FilePath,
        Title = entity.Title,
        ThumbnailUrl = entity.ThumbnailUrl,
        CreatedByUserId = entity.CreatedByUserId,
        CreatedAt = entity.CreatedAt,
    };
}
