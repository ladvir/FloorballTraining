using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class SeasonEFCoreFactory(ISeasonRepository repository, ITeamFactory teamFactory)
    : ISeasonFactory
{
    public async Task<Season> GetMergedOrBuild(SeasonDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new Season();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Season entity, SeasonDto dto)
    {

        entity.Id = dto.Id;
        entity.Name = dto.Name;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;

        await TeamsMergeOrBuild(entity, dto);

    }

    private async Task TeamsMergeOrBuild(Season entity, SeasonDto dto)
    {
        if (dto.Teams.Count == 0) return;

        foreach (var team in dto.Teams.Select(async teamDto => await teamFactory.GetMergedOrBuild(teamDto ?? new TeamDto())))
        {
            entity.Teams.Add(await team);
        }
    }
}