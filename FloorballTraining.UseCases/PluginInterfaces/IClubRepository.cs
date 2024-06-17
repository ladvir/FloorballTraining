using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IClubRepository : IGenericRepository<Club>
{
    Task<Club> GetClubByIdAsync(int clubId);
    Task AddClubAsync(Club club);
    Task UpdateClubAsync(Club club);
    Task DeleteClubAsync(int clubId);

    Task<List<Club>> GetAllSimpleAsync();
}