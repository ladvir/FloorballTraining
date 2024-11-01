using System.Linq.Expressions;

namespace FloorballTraining.CoreBusiness.Specifications;

public class BaseSpecification<T> : ISpecification<T>
{
    public BaseSpecification()
    {

    }
    public BaseSpecification(Expression<Func<T, bool>>? criteria)
    {
        Criteria = criteria;
    }

    public List<string> IncludeStrings { get; } = [];

    public Expression<Func<T, bool>>? Criteria { get; }
    public List<Expression<Func<T, object>>> Includes { get; } = [];
    public Expression<Func<T, object>>? OrderBy { get; private set; }
    public Expression<Func<T, object>>? OrderByDescending { get; private set; }
    public int Take { get; private set; }
    public int Skip { get; private set; }
    public bool IsPaginationEnabled { get; private set; }

    protected void AddInclude(Expression<Func<T, object?>>? includeExpression)
    {
        if (includeExpression != null)
        {
            Includes.Add(includeExpression!);
        }
    }

    protected void AddInclude(string includeString)
    {
        IncludeStrings.Add(includeString);
    }


    protected void AddOrderBy(Expression<Func<T, object>> orderByExpression)
    {
        OrderBy = orderByExpression;
    }

    protected void AddOrderByDescending(Expression<Func<T, object>> orderByDescendingExpression)
    {
        OrderByDescending = orderByDescendingExpression;
    }

    protected void ApplyPagination(int skip, int take)
    {
        Skip = skip;
        Take = take;
        IsPaginationEnabled = true;
    }
}