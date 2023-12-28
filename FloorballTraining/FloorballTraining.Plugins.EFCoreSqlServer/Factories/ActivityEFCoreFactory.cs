using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using Environment = FloorballTraining.CoreBusiness.Environment;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class ActivityEFCoreFactory : IActivityFactory
{
    private readonly IActivityRepository _repository;

    public ActivityEFCoreFactory(IActivityRepository repository)
    {
        _repository = repository;
    }

    public async Task<Activity> GetMergedOrBuild(ActivityDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new Activity();

        MergeDto(entity, dto);

        return entity;
    }
    public void MergeDto(Activity entity, ActivityDto dto)
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

        //todo doplnit konstrukci pro podrizene kolekce
    }
}