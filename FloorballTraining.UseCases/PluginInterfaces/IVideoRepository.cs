using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IVideoRepository
{
    Task<Video> AddAsync(Video video);
    Task<Video?> GetByIdAsync(int id);
    Task DeleteAsync(Video video);
}
