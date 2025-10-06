using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.TeamMembers.Interfaces;

public interface IDeleteTeamMemberUseCase
{
    Task ExecuteAsync(int memberDto);
}