using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubsAllSimpleUseCase(
    IClubRepository repository,
    IMapper mapper) : IViewClubsAllSimpleUseCase
{
    public async Task<IReadOnlyList<ClubDto>?> ExecuteAsync()
    {
        var items = await repository.GetAllSimpleAsync();

        return mapper.Map<IReadOnlyList<Club>, IReadOnlyList<ClubDto>>(items);
    }
}