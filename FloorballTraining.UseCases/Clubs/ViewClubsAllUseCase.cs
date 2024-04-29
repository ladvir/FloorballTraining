using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubsAllUseCase : IViewClubsAllUseCase
{
    private readonly IClubRepository _repository;
    private readonly IMapper _mapper;

    public ViewClubsAllUseCase(
        IClubRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<ClubDto>> ExecuteAsync()
    {
        var items = await _repository.GetAllAsync();

        return _mapper.Map<IReadOnlyList<Club>, IReadOnlyList<ClubDto>>(items);
    }
}
