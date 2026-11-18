using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Clubs.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubsAllUseCase(
    IClubRepository repository,
    AppMapper mapper) : IViewClubsAllUseCase
{
    public async Task<IReadOnlyList<ClubDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.ToClubDtos(items);
    }
}