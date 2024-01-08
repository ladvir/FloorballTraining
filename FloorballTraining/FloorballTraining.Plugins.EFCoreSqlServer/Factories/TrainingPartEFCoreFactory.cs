using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TrainingPartEFCoreFactory : ITrainingPartFactory
{
    private readonly ITrainingPartRepository _repository;
    private readonly ITrainingGroupFactory _trainingGroupFactory;

    public TrainingPartEFCoreFactory(ITrainingPartRepository repository, ITrainingGroupFactory trainingGroupFactory)
    {
        _repository = repository;
        _trainingGroupFactory = trainingGroupFactory;
    }

    public async Task<TrainingPart> GetMergedOrBuild(TrainingPartDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new TrainingPart();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(TrainingPart entity, TrainingPartDto dto)
    {

        entity.Id = dto.Id;
        entity.Description = dto.Description;
        entity.Name = dto.Name;
        entity.Duration = dto.Duration;
        entity.Order = dto.Order;


        if (dto.TrainingGroups == null) return;

        foreach (var trainingGroup in dto.TrainingGroups.Select(async trainingGroupDto => await _trainingGroupFactory.GetMergedOrBuild(trainingGroupDto)))
        {
            entity.TrainingGroups.Add(await trainingGroup);
        }


    }
}