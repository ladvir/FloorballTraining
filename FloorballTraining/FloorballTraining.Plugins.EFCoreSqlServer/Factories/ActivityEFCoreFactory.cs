using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using Environment = FloorballTraining.CoreBusiness.Environment;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class ActivityEFCoreFactory : IActivityFactory
{
    private readonly IActivityRepository _repository;
    private readonly IActivityEquipmentFactory _activityEquipmentFactory;
    private readonly IActivityTagFactory _activityTagFactory;

    public ActivityEFCoreFactory(IActivityRepository repository, IActivityTagFactory activityTagFactory, IActivityEquipmentFactory activityEquipmentFactory)
    {
        _repository = repository;
        _activityTagFactory = activityTagFactory;
        _activityEquipmentFactory = activityEquipmentFactory;
    }

    public async Task<Activity> GetMergedOrBuild(ActivityDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new Activity();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(Activity entity, ActivityDto dto)
    {
        entity.Id = dto.Id;
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.PlaceWidth = dto.PlaceWidth;
        entity.PlaceLength = dto.PlaceLength;
        entity.Environment = (Environment)Enum.Parse(typeof(Environment), dto.Environment);
        entity.Difficulty = dto.Difficulty;
        entity.DurationMin = dto.DurationMin;
        entity.DurationMax = dto.DurationMax;
        entity.PersonsMin = dto.PersonsMin;
        entity.PersonsMax = dto.PersonsMax;

        await TagsMergeOrBuild(entity, dto);
        await EquipmentsMergeOrBuild(entity, dto);

    }

    private async Task TagsMergeOrBuild(Activity entity, ActivityDto dto)
    {
        if (!dto.ActivityTags.Any()) return;

        foreach (var activityTag in dto.ActivityTags.Select(async tagDto => await _activityTagFactory.GetMergedOrBuild(tagDto)))
        {
            entity.ActivityTags.Add(await activityTag);
        }
    }

    private async Task EquipmentsMergeOrBuild(Activity entity, ActivityDto dto)
    {
        if (!dto.ActivityEquipments.Any()) return;

        foreach (var activityEquipmentDto in dto.ActivityEquipments)
        {

            var activityEquipment = await _activityEquipmentFactory.GetMergedOrBuild(activityEquipmentDto);

            entity.ActivityEquipments.Add(activityEquipment);
        }
    }
}