using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Members.Interfaces
{
    public interface IViewMembersAllUseCase
    {
        Task<IReadOnlyList<MemberDto>> ExecuteAsync();
    }
}