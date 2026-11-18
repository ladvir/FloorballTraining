using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Seasons.Interfaces;

namespace FloorballTraining.UseCases.Seasons;

public class ViewSeasonsAllUseCase(
        ISeasonRepository repository,
        AppMapper mapper) : IViewSeasonsAllUseCase
    {
        public async Task<IReadOnlyList<SeasonDto>> ExecuteAsync()
        {
            var items = await repository.GetAllAsync();
            return mapper.ToSeasonDtos(items);
        }

        public async Task<IReadOnlyList<SeasonDto>> ExecuteAsync(int? clubId)
        {
            if (!clubId.HasValue) return await ExecuteAsync();

            var items = await repository.GetSeasonsByClubIdAsync(clubId);
            return mapper.ToSeasonDtos(items);
        }
    }