using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Seasons.Interfaces;

namespace FloorballTraining.UseCases.Seasons;

public class EditSeasonUseCase(
    ISeasonRepository repository, ISeasonFactory seasonFactory) : IEditSeasonUseCase
{
    public async Task ExecuteAsync(SeasonDto seasonDto)
    {
        var season = await seasonFactory.GetMergedOrBuild(seasonDto);

        await repository.UpdateSeasonAsync(season);
    }
}