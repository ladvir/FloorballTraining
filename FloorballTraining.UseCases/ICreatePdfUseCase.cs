using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases;

public interface ICreatePdfUseCase<TDto> where TDto : BaseEntityDto
{
    Task<byte[]?> ExecuteAsync(int id, string requestedFrom);
    Task<byte[]?> ExecuteAsync(TDto? dto, string requestedFrom);
}