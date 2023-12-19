using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags;

public interface IGetTagByIdUseCase
{
    Task<Tag> ExecuteAsync(int tagId);
}

