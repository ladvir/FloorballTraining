using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Members.Interfaces;

public interface IViewMemberByIdUseCase
{
    Task<MemberDto?> ExecuteAsync(int memberId);
}