using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.TeamMembers.Interfaces;

public interface IAddTeamMemberUseCase
{
    Task ExecuteAsync(TeamMemberDto memberDto);
}