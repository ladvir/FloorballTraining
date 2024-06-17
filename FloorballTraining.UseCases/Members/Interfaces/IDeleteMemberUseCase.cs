using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Members.Interfaces;

public interface IDeleteMemberUseCase
{
    Task ExecuteAsync(MemberDto memberDto);
}