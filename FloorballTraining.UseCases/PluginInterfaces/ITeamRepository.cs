using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface ITeamRepository : IGenericRepository<Team>
{
    Task AddTeamAsync(Team team);
}