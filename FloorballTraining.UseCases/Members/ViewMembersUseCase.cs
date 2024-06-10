using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Members;

public class ViewMembersWithSpecificationUseCase(
    IMemberRepository repository,
    IMapper mapper) : IViewMembersWithSpecificationUseCase
{
    public async Task<Pagination<MemberDto>> ViewPaginatedAsync(MemberSpecificationParameters parameters)
    {
        var countSpecification = new MembersWithFilterForCountSpecification(parameters);

        var totalItems = await repository.CountAsync(countSpecification);

        var data = await ViewAsync(parameters);

        return new Pagination<MemberDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }

    public async Task<IReadOnlyList<MemberDto>?> ViewAsync(MemberSpecificationParameters parameters)
    {
        var specification = new MembersSpecification(parameters);
        var items = await repository.GetListAsync(specification);
        return mapper.Map<IReadOnlyList<Member>, IReadOnlyList<MemberDto>>(items);

    }
}