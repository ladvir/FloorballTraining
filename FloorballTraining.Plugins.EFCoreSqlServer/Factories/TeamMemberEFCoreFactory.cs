using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TeamMemberEFCoreFactory(ITeamMemberRepository repository) : ITeamMemberFactory
{
    public async Task<TeamMember> GetMergedOrBuild(TeamMemberDto? dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));


        dto ??= new TeamMemberDto();

        var entity = await repository.GetByIdAsync(dto.Id) ?? new TeamMember();

        await MergeDto(entity, dto);

        return entity;
    }



    public async Task MergeDto(TeamMember entity, TeamMemberDto dto)
    {
        await Task.Run(() =>
                {
                    entity.Id = dto.Id;
                    if (dto.MemberId != null) entity.MemberId = dto.MemberId!.Value;
                    entity.IsCoach = dto.IsCoach;
                    entity.IsPlayer = dto.IsPlayer;
                    entity.TeamId = dto.TeamId!.Value;
                });
    }
}