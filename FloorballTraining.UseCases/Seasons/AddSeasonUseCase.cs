using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Seasons.Interfaces;

namespace FloorballTraining.UseCases.Seasons;

public class AddSeasonUseCase(
    ISeasonRepository repository, ISeasonFactory seasonFactory) : IAddSeasonUseCase
{
    public async Task ExecuteAsync(SeasonDto seasonDto)
    {
        var season = await seasonFactory.GetMergedOrBuild(seasonDto);
        seasonDto.Id = await repository.AddSeasonAsync(season);
        
    }
}