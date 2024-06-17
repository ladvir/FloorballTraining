using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Members.Interfaces
{
    public interface IAddMemberUseCase
    {
        Task ExecuteAsync(MemberDto memberDto);
    }
}