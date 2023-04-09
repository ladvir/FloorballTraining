using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags;

public interface IViewTagByIdUseCase
{
    Task<Tag> ExecuteAsync(int tagId);
}