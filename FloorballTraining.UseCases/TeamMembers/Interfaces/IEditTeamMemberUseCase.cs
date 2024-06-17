using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.TeamMembers.Interfaces;

public interface IEditTeamMemberUseCase
{
    Task ExecuteAsync(TeamMemberDto memberDto);
}