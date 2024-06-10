using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TeamEFCoreFactory(
    ITeamRepository repository,
    IAgeGroupFactory ageGroupFactory,
    ITeamMemberFactory teamMemberFactory,
    ITeamTrainingFactory teamTrainingFactory)
    : ITeamFactory
{
    public async Task<Team> GetMergedOrBuild(TeamDto? dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));


        dto ??= new TeamDto();

        var entity = await repository.GetTeamByIdAsync(dto.Id) ?? new Team();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(Team entity, TeamDto dto)
    {
        await Task.Run(async () =>
            {
                entity.Id = dto.Id;
                entity.Name = dto.Name;
                entity.AgeGroupId = dto.AgeGroupId;
                entity.AgeGroup = await ageGroupFactory.GetMergedOrBuild(dto.AgeGroup);
                entity.ClubId = dto.ClubId;



                foreach (var teamMember in dto.TeamMembers)
                {
                    entity.TeamMembers.Add(await teamMemberFactory.GetMergedOrBuild(teamMember));
                }

                foreach (var teamTraining in dto.TeamTrainings)
                {
                    entity.TeamTrainings.Add(await teamTrainingFactory.GetMergedOrBuild(teamTraining));
                }
            });
    }
}