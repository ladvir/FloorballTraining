﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Specifications;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IGenericRepository<T> where T : BaseEntity
{
    Task<T> GetByIdAsync(int id);

    Task<IReadOnlyList<T>> GetAllAsync();

    Task<T> GetWithSpecification(ISpecification<T> specification);

    Task<IReadOnlyList<T>> GetListAsync(ISpecification<T> specification);

    Task<int> CountAsync(ISpecification<T> specification);
}