using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Members;

public class ViewMembersAllUseCase(
    IMemberRepository repository,
    AppMapper mapper) : IViewMembersAllUseCase
{
    public async Task<IReadOnlyList<MemberDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.ToMemberDtos(items);
    }
}
