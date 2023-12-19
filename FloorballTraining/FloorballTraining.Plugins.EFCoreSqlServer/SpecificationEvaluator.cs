using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Specifications;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class SpecificationEvaluator<TEntity> where TEntity : BaseEntity
    {
        public static IQueryable<TEntity> GetQuery(
            IQueryable<TEntity> inputQuery,
            ISpecification<TEntity> specification)
        {


            var query = inputQuery;

            if (specification?.Criteria != null)
            {
                query = query.Where(specification.Criteria);
            }

            if (specification != null)
            {
                query = specification.Includes.Aggregate(query, (current, include) => current.Include(include));
            }

            return query;

        }
    }
}
