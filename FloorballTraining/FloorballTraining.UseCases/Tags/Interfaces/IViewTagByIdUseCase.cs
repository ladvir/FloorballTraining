using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Tags;

public interface IViewTagByIdUseCase
{
    Task<TagDto> ExecuteAsync(int tagId);
}