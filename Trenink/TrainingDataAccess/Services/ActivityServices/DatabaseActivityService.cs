using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Dtos;
using TrainingDataAccess.Extensions;
using TrainingDataAccess.Mappers;
using TrainingDataAccess.Models;
using TrainingDataAccess.Models.Factories;

namespace TrainingDataAccess.Services.ActivityServices
{
    public class DatabaseActivityService : IActivityService
    {
        private readonly IDbContextFactory<TrainingDbContext> _trainingDbContextFactory;

        private readonly IActivityFactory _activityFactory;



        public DatabaseActivityService(IDbContextFactory<TrainingDbContext> trainingDbContextFactory, IActivityFactory activityFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
            _activityFactory = activityFactory;

        }


        public async Task SaveActivity(ActivityDto activityDto)
        {

            var activity = _activityFactory.Build(activityDto);

            if (activity.ActivityId == 0)
            {
                await CreateActivity(activity);
            }

            await UpdateActivity(activity);
        }

        public async Task<Activity> CreateActivity(Activity activity)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            context.Activities.Attach(activity);

            context.Entry(activity).State = EntityState.Added;

            await context.SaveChangesAsync();
            return activity;
        }


        public async Task<DataResult<ActivityOverviewDto>> GetActivities(PaginationDTO pagination, string searchString)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var words = searchString.Split(' ');

            var queryable = context.Activities.AsQueryable().MapToActivityOverviewDto().AsNoTracking()
                    .OrderBy(o => o.ActivityId)
                    //.Where(Activity.Contains(words))
                    ;

            var result = new DataResult<ActivityOverviewDto>
            {
                Items = await queryable.Paginate(pagination).ToListAsync(),
                Count = await queryable.CountAsync()
            };

            return result;
        }

        public async Task<List<ActivityOverviewDto>> GetActivitiesAll(string searchString)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var words = searchString.Split(' ');

            return await context.Activities
                .AsQueryable()
                .AsNoTracking()
                .OrderBy(o => o.ActivityId)
                .Where(Activity.Contains(words))
                .MapToActivityOverviewDto()
                .ToListAsync();
        }

        public async Task<ActivityDto> GetActivity(int id)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Activities.MapToActivityDto().SingleAsync(a => a.ActivityId == id);
        }

        public async Task UpdateActivity(Activity activity)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            try
            {
                var existingActivity = context.Activities
                    .Where(p => p.ActivityId == activity.ActivityId)
                    .Include(p => p.ActivityTags)
                    .SingleOrDefault();

                if (existingActivity == null)
                {
                    return;
                }

                context.Attach(existingActivity);
                context.Entry(existingActivity).State = EntityState.Modified;
                context.Entry(existingActivity).CurrentValues.SetValues(activity);
                // Delete children
                var tagsForRemoval = existingActivity.ActivityTags.Where(at => activity.ActivityTags.All(a => at.TagId != a.TagId)).ToList();

                foreach (var tag in tagsForRemoval)
                {
                    existingActivity.ActivityTags?.Remove(tag);
                }

                if (activity.ActivityTags.Any())
                {
                    // Update and Insert children
                    foreach (var tag in activity.ActivityTags)
                    {
                        var existingTags = existingActivity.ActivityTags?
                            .SingleOrDefault(c => c.TagId == tag.TagId && c.TagId != default);

                        if (existingTags != null)
                            // Update child
                            context.Entry(existingTags).CurrentValues.SetValues(tag);
                        else
                        {
                            existingActivity.AddActivityTag(tag);
                        }
                    }
                }

                await context.SaveChangesAsync();
            }
            catch (Exception x)
            {
                throw new Exception("Ukládání změn do databáze se nepodařilo", x);
            }
        }

        public async Task DeleteActivity(int activityId)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var existingActivity = context.Activities
                .SingleOrDefault(p => p.ActivityId == activityId);

            if (existingActivity == null)
            {
                return;
            }

            context.Remove(existingActivity);

            await context.SaveChangesAsync();
        }
    }


    public static class PredicateBuilder
    {
        public static Expression<Func<T, bool>> True<T>() { return f => true; }
        public static Expression<Func<T, bool>> False<T>() { return f => false; }

        public static Expression<Func<T, bool>> Or<T>(this Expression<Func<T, bool>> expr1,
            Expression<Func<T, bool>> expr2)
        {
            var invokedExpr = Expression.Invoke(expr2, expr1.Parameters.Cast<Expression>());
            return Expression.Lambda<Func<T, bool>>
                (Expression.OrElse(expr1.Body, invokedExpr), expr1.Parameters);
        }

        public static Expression<Func<T, bool>> And<T>(this Expression<Func<T, bool>> expr1,
            Expression<Func<T, bool>> expr2)
        {
            var invokedExpr = Expression.Invoke(expr2, expr1.Parameters.Cast<Expression>());
            return Expression.Lambda<Func<T, bool>>
                (Expression.AndAlso(expr1.Body, invokedExpr), expr1.Parameters);
        }
    }
}