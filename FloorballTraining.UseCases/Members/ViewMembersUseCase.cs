using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Members;

public class ViewMembersWithSpecificationUseCase : IViewMembersWithSpecificationUseCase
{
    private readonly IMemberRepository _repository;
    private readonly IMapper _mapper;

    public ViewMembersWithSpecificationUseCase(
        IMemberRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<Pagination<MemberDto>> ViewPaginatedAsync(MemberSpecificationParameters parameters)
    {
        var countSpecification = new MembersWithFilterForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var data = await ViewAsync(parameters);

        return new Pagination<MemberDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }

    public async Task<IReadOnlyList<MemberDto>?> ViewAsync(MemberSpecificationParameters parameters)
    {
        var specification = new MembersSpecification(parameters);
        var items = await _repository.GetListAsync(specification);
        return _mapper.Map<IReadOnlyList<Member>, IReadOnlyList<MemberDto>>(items);

    }
}