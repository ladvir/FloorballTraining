using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Clubs;

public class ViewClubsAllSimpleUseCase(
    IClubRepository repository,
    AppMapper mapper) : IViewClubsAllSimpleUseCase
{
    public async Task<IReadOnlyList<ClubDto>?> ExecuteAsync()
    {
        var items = await repository.GetAllSimpleAsync();

        return mapper.ToClubDtos(items);
    }
}