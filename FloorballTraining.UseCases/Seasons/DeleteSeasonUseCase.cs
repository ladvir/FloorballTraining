using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Seasons.Interfaces;

namespace FloorballTraining.UseCases.Seasons;

public class DeleteSeasonUseCase(ISeasonRepository seasonRepository) : IDeleteSeasonUseCase
{
    public async Task ExecuteAsync(int seasonId)
    {
        await seasonRepository.DeleteSeasonAsync(seasonId);
    }
}