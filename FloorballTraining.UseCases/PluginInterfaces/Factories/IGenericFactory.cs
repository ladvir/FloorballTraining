using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.PluginInterfaces.Factories;

public interface IGenericFactory<T, TDto>
    where T : BaseEntity
    where TDto : BaseEntityDto
{
    Task<T> GetMergedOrBuild(TDto dto);
    Task MergeDto(T entity, TDto dto);
}