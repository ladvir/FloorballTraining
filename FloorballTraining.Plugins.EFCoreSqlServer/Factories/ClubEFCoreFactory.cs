using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class ClubEFCoreFactory(IClubRepository repository, IMemberFactory memberFactory, ITeamFactory teamFactory)
    : IClubFactory
{
    public async Task<Club> GetMergedOrBuild(ClubDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new Club();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Club entity, ClubDto dto)
    {

        entity.Id = dto.Id;
        entity.Name = dto.Name;

        await MembersMergeOrBuild(entity, dto);

        await TeamsMergeOrBuild(entity, dto);

    }

    private async Task MembersMergeOrBuild(Club entity, ClubDto dto)
    {
        if (dto.Members != null && !dto.Members.Any()) return;

        foreach (var member in dto.Members!.Select(async memberDto => await memberFactory.GetMergedOrBuild(memberDto)))
        {
            entity.Members.Add(await member);
        }
    }

    private async Task TeamsMergeOrBuild(Club entity, ClubDto dto)
    {
        if (!dto.Teams.Any()) return;

        foreach (var team in dto.Teams.Select(async teamDto => await teamFactory.GetMergedOrBuild(teamDto)))
        {
            entity.Teams.Add(await team);
        }
    }
}