using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags;

public interface IViewTagByParentTagIdUseCase
{
    Task<IEnumerable<Tag>> ExecuteAsync(int? parentTagId);
}