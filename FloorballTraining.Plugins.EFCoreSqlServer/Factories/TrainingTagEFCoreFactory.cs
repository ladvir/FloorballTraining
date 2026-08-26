using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class TrainingTagEFCoreFactory(ITrainingTagRepository repository, ITagFactory tagFactory) : ITrainingTagFactory
{
    public async Task<TrainingTag> GetMergedOrBuild(TrainingTagDto dto)
    {
        var entity = await repository.GetByIdAsync(dto.Id) ?? new TrainingTag();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(TrainingTag entity, TrainingTagDto dto)
    {
        entity.Id = dto.Id;

        var trainingTag = await tagFactory.GetMergedOrBuild(dto.Tag!);

        entity.Tag = trainingTag;
        entity.TagId = trainingTag.Id;
        entity.TrainingId = entity.TrainingId;
    }
}
