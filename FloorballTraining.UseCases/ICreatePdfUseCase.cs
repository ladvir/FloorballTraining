using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Reporting;

namespace FloorballTraining.UseCases;

public interface ICreatePdfUseCase<in TDto> where TDto : BaseEntityDto
{
    Task<byte[]?> ExecuteAsync(int id, string requestedFrom, PdfOptions? options = null);
    Task<byte[]?> ExecuteAsync(TDto? dto, string requestedFrom, PdfOptions? options = null);
}