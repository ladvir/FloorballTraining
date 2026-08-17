using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IVideoRepository
{
    Task<Video> AddAsync(Video video);
    Task<Video?> GetByIdAsync(int id);
    Task<List<Video>> GetByOwnerAsync(VideoOwnerType ownerType, int ownerId);
    Task DeleteAsync(Video video);
}
