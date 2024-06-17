using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.TeamMembers.Interfaces;

public interface IDeleteTeamMemberUseCase
{
    Task ExecuteAsync(TeamMemberDto memberDto);
}