using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Seasons.Interfaces;

namespace FloorballTraining.UseCases.Seasons;

public class ViewSeasonsAllUseCase(
        ISeasonRepository repository,
        IMapper mapper) : IViewSeasonsAllUseCase
    {
        public async Task<IReadOnlyList<SeasonDto>> ExecuteAsync()
        {
            var items = await repository.GetAllAsync();

            return mapper.Map<IReadOnlyList<Season>, IReadOnlyList<SeasonDto>>(items);
        }
    }