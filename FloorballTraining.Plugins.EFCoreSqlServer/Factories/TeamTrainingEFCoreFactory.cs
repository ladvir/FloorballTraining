using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TeamTrainingEFCoreFactory : ITeamTrainingFactory
{
    private readonly ITeamTrainingRepository _repository;

    public TeamTrainingEFCoreFactory(
        ITeamTrainingRepository repository

        )
    {
        _repository = repository;
    }

    public async Task<TeamTraining> GetMergedOrBuild(TeamTrainingDto? dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));


        dto ??= new TeamTrainingDto();

        var entity = await _repository.GetByIdAsync(dto.Id) ?? new TeamTraining();

        await MergeDto(entity, dto);

        return entity;
    }



    public async Task MergeDto(TeamTraining entity, TeamTrainingDto dto)
    {
        await Task.Run(() =>
                {
                    entity.Id = dto.Id;
                    entity.TrainingId = dto.TrainingId;
                    entity.TeamId = dto.TeamId;
                    return Task.CompletedTask;
                });
    }
}