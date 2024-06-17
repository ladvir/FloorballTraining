using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface ITeamRepository : IGenericRepository<Team>
{
    Task AddTeamAsync(Team team);

    Task DeleteTeamAsync(int teamId);
    Task UpdateTeamAsync(Team team);

    Task<Team?> GetTeamByIdAsync(int teamId);

    Task<List<Team>> GetAllTeamsAsync();

    Task<IReadOnlyList<Team>> GetAllSimpleAsync();
}