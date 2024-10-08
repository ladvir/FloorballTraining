﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class GenericEFCoreRepository<T>(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
    : IGenericRepository<T>
    where T : BaseEntity
{
    public async Task<T?> GetByIdAsync(int id)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();

        return (await context.Set<T>().Where(s => s.Id == id).FirstOrDefaultAsync());
    }

    public async Task<IReadOnlyList<T>> GetAllAsync()
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();
        return await context.Set<T>().ToListAsync();
    }

    public async Task<T?> GetWithSpecification(ISpecification<T> specification)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();
        return (await ApplySpecification(context, specification).FirstOrDefaultAsync())!;
    }

    public async Task<IReadOnlyList<T>> GetListAsync(ISpecification<T> specification)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();
        return await ApplySpecification(context, specification).ToListAsync();
    }

    public async Task<int> CountAsync(ISpecification<T> specification)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();
        return await ApplySpecification(context, specification).CountAsync();
    }

    public async Task<int> CountAllAsync()
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();
        return await context.Set<T>().CountAsync();
    }

    public IQueryable<T> ApplySpecification(FloorballTrainingContext context, ISpecification<T> specification)
    {

        return SpecificationEvaluator<T>.GetQuery(context.Set<T>().AsQueryable(), specification);
    }
}