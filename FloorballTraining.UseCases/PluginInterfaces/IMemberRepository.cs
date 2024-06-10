using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IMemberRepository : IGenericRepository<Member>
{
    Task AddMemberAsync(Member member);

    Task DeleteMemberAsync(Member member);
    Task UpdateMemberAsync(Member member);
}