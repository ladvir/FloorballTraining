using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IClubRepository : IGenericRepository<Club>
{
    Task AddClubAsync(Club club);
    Task UpdateClubAsync(Club club);
    Task DeleteClubAsync(int clubId);
}