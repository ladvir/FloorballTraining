using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Places.Interfaces;

public interface IViewPlacesUseCase
{
    Task<Pagination<PlaceDto>> ExecuteAsync(PlaceSpecificationParameters parameters);
}