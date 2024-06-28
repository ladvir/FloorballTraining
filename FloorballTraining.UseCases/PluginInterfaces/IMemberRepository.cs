using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IMemberRepository : IGenericRepository<Member>
{
    Task<Member?> GetMemberByIdAsync(int memberId);

    Task AddMemberAsync(Member member);

    Task DeleteMemberAsync(Member member);
    Task UpdateMemberAsync(Member member);
}