using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TrainingGroupEFCoreFactory : ITrainingGroupFactory
{
    private readonly ITrainingGroupRepository _repository;
    private readonly IActivityFactory _activityFactory;

    public TrainingGroupEFCoreFactory(ITrainingGroupRepository repository, IActivityFactory activityFactory)
    {
        _repository = repository;
        _activityFactory = activityFactory;
    }

    public async Task<TrainingGroup> GetMergedOrBuild(TrainingGroupDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new TrainingGroup();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(TrainingGroup entity, TrainingGroupDto dto)
    {

        entity.Id = dto.Id;
        entity.PersonsMin = dto.PersonsMin;
        entity.PersonsMax = dto.PersonsMax;

        if (dto.Activity != null)
        {
            var activity = await _activityFactory.GetMergedOrBuild(dto.Activity);

            entity.Activity = activity;
            entity.ActivityId = activity.Id;

        }
        else
        {
            dto.Activity = new ActivityDto();
        }
    }
}