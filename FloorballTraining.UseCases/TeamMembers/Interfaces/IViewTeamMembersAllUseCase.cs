using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.TeamMembers.Interfaces;

public interface IViewTeamMembersAllUseCase
{
    Task<IReadOnlyList<TeamMemberDto>> ExecuteAsync();
}