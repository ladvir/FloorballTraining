using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Trainings;

public interface IViewTrainingsUseCase
{
    Task<Pagination<TrainingDto>> ExecuteAsync(TrainingSpecificationParameters parameters);
}