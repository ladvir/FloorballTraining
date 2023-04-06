using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags.Interfaces;

public interface IViewTagByParentTagIdUseCase
{
    Task<IEnumerable<Tag>> ExecuteAsync(int? parentTagId);
}