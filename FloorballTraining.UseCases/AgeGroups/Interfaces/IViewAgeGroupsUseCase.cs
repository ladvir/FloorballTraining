﻿using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Places;

public interface IViewAgeGroupsUseCase
{
    Task<Pagination<AgeGroupDto>> ExecuteAsync(AgeGroupSpecificationParameters parameters);
}