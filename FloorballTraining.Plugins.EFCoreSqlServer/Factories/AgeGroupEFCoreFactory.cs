using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class AgeGroupEFCoreFactory(IAgeGroupRepository repository) : IAgeGroupFactory
{
    public async Task<AgeGroup> GetMergedOrBuild(AgeGroupDto? dto)
    {
        if (dto == null) return null;
        var entity = await repository.GetByIdAsync(dto.Id) ?? new AgeGroup();

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