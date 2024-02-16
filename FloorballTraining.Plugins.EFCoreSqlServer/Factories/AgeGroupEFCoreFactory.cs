using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class AgeGroupEFCoreFactory : IAgeGroupFactory
{
    private readonly IAgeGroupRepository _repository;

    public AgeGroupEFCoreFactory(IAgeGroupRepository repository)
    {
        _repository = repository;
    }

    public async Task<AgeGroup> GetMergedOrBuild(AgeGroupDto dto)
    {
        var entity = await _repository.GetByIdAsync(dto.Id) ?? new AgeGroup();

        await MergeDto(entity, dto);

        return entity;
    }
    public async Task MergeDto(AgeGroup entity, AgeGroupDto dto)
    {

        await Task.Run(() =>
        {
            entity.Id = dto.Id;
            entity.Name = dto.Name;
        });

    }
}