using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TrainingGroupEFCoreFactory(ITrainingGroupRepository repository, IActivityFactory activityFactory)
    : ITrainingGroupFactory
{
    public async Task<TrainingGroup> GetMergedOrBuild(TrainingGroupDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new TrainingGroup();

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
            var activity = await activityFactory.GetMergedOrBuild(dto.Activity);

            //entity.Activity = activity;
            entity.ActivityId = activity.Id;

        }
        else
        {
            entity.Activity = new Activity();
            entity.ActivityId = null;
        }
    }
}