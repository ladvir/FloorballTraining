using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Members;

public class ViewTeamsAllUseCase : IViewMembersAllUseCase
{
    private readonly IMemberRepository _repository;
    private readonly IMapper _mapper;

    public ViewTeamsAllUseCase(
        IMemberRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<MemberDto>> ExecuteAsync()
    {
        var items = await _repository.GetAllAsync();

        return _mapper.Map<IReadOnlyList<Member>, IReadOnlyList<MemberDto>>(items);
    }
}
