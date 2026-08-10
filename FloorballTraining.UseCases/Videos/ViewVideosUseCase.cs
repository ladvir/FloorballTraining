using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Videos.Interfaces;

namespace FloorballTraining.UseCases.Videos;

public class ViewVideosUseCase(IVideoRepository videoRepository) : IViewVideosUseCase
{
    public async Task<List<VideoDto>> ExecuteAsync(VideoOwnerType ownerType, int ownerId)
    {
        var videos = await videoRepository.GetByOwnerAsync(ownerType, ownerId);
        return videos.Select(v => v.ToDto()).ToList();
    }
}
