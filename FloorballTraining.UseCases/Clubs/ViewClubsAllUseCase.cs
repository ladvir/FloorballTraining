using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubsAllUseCase(
    IClubRepository repository,
    IMapper mapper) : IViewClubsAllUseCase
{
    public async Task<IReadOnlyList<ClubDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.Map<IReadOnlyList<Club>, IReadOnlyList<ClubDto>>(items);
    }
}