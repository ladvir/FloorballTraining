using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.TeamMembers.Interfaces;

public interface IViewTeamMemberByIdUseCase
{
    Task<TeamMemberDto?> ExecuteAsync(int memberId);
}