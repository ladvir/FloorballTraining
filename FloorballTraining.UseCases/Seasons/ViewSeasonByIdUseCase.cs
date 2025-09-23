using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Seasons.Interfaces;

namespace FloorballTraining.UseCases.Seasons;

public class ViewSeasonByIdUseCase(
    ISeasonRepository repository,
    IMapper mapper) : IViewSeasonByIdUseCase
{
    public async Task<SeasonDto?> ExecuteAsync(int seasonId)
    {
        var item = await repository.GetWithSpecification(new BaseSpecification<Season>(s=>s.Id == seasonId ));
        return mapper.Map<Season?, SeasonDto>(item);
    }
}