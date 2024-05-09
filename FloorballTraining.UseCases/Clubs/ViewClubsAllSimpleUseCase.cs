using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubsAllSimpleUseCase : IViewClubsAllSimpleUseCase
{
    private readonly IClubRepository _repository;
    private readonly IMapper _mapper;

    public ViewClubsAllSimpleUseCase(
        IClubRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<ClubDto>> ExecuteAsync()
    {
        var items = await _repository.GetAllSimpleAsync();

        return _mapper.Map<IReadOnlyList<Club>, IReadOnlyList<ClubDto>>(items);
    }
}