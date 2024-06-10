using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Members.Interfaces;

public interface IEditMemberUseCase
{
    Task ExecuteAsync(MemberDto memberDto);
}