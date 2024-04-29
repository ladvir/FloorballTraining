using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IMemberRepository : IGenericRepository<Member>
{
    Task AddMemberAsync(Member member);
}