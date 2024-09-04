using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface ITeamMemberRepository : IGenericRepository<TeamMember>
{
    Task AddTeamMemberAsync(TeamMember member);

    Task DeleteTeamMemberAsync(TeamMember member);
    Task UpdateTeamMemberAsync(TeamMember member);
}