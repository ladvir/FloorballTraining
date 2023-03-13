using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Dtos;
using TrainingDataAccess.Extensions;
using TrainingDataAccess.Models;
using TrainingDataAccess.Services.TagServices;

namespace TrainingDataAccess.Services.ActivityServices
{
    public class DatabaseActivityService : IActivityService
    {
        private readonly IDbContextFactory<TrainingDbContext> _trainingDbContextFactory;

        private readonly IActivityFactory _activityFactory;

        private readonly ITagService _tagService;

        public DatabaseActivityService(IDbContextFactory<TrainingDbContext> trainingDbContextFactory, IActivityFactory activityFactory, ITagService tagService)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
            _activityFactory = activityFactory;
            _tagService = tagService;
        }


        public async Task SaveActivity(ActivityDto activityDto)
        {

            var activity = _activityFactory.Build(activityDto);


            var tags = await _tagService.GetAllTagsByIds(activityDto.TagIds);

            activity.AddTags(tags);

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

        public async Task<List<ActivityDto>> GetAllActivities()
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Activities.AsNoTrackingWithIdentityResolution().MapActivityToDto().ToListAsync();
        }

        public async Task<DataResult<ActivityDto>> GetActivities(PaginationDTO pagination, string searchString)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var words = searchString.Split(' ');

            var queryable = context.Activities.AsQueryable().AsNoTracking()
                    .OrderBy(o => o.ActivityId)
                    .Where(Activity.ContainsInDescription(words)

                    )

                ;

            var result = new DataResult<ActivityDto>
            {
                Items = await queryable.Paginate(pagination).MapActivityToDto().ToListAsync(),
                Count = await queryable.CountAsync()
            };

            return result;
        }

        public async Task<ActivityDto> GetActivity(int id)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Activities.MapActivityToDto().SingleAsync(a => a.ActivityId == id);
        }

        public async Task UpdateActivity(Activity activity)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            try
            {
                var existingActivity = context.Activities
                    .Where(p => p.ActivityId == activity.ActivityId)
                    .Include(p => p.Tags)
                    .SingleOrDefault();

                if (existingActivity == null)
                {
                    return;
                }

                context.Entry(existingActivity).CurrentValues.SetValues(activity);

                // Delete children
                var tagsForRemoval = (from existingTag in existingActivity.Tags let tag = activity.Tags?.SingleOrDefault(i => i.TagId == existingTag.TagId) where tag == null select existingTag).ToList();

                foreach (var tag in tagsForRemoval)
                {
                    existingActivity.Tags?.Remove(tag);
                }

                if (activity.Tags.Any())
                {
                    // Update and Insert children
                    foreach (var tag in activity.Tags)
                    {
                        if (existingActivity.Tags != null)
                        {
                            var existingTags = existingActivity.Tags
                                .SingleOrDefault(c => c.TagId == tag.TagId && c.TagId != default);

                            if (existingTags != null)
                                // Update child
                                context.Entry(existingTags).CurrentValues.SetValues(tag);
                            else
                            {
                                // Insert child
                                var newChild = new Tag
                                {
                                    TagId = tag.TagId,
                                    Name = tag.Name,
                                    Color = tag.Color,
                                    ParentTagId = tag.ParentTagId
                                };


                                if (tag.Activities != null)
                                    newChild.Activities = new List<Activity>(tag.Activities);

                                existingActivity.Tags.Add(newChild);
                            }
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

        public async Task DeleteActivity(Activity activity)
        {
            await using var context = _trainingDbContextFactory.CreateDbContext();

            var existingActivity = context.Activities
                .Where(p => p.ActivityId == activity.ActivityId)
                .Include(p => p.Tags)
                .SingleOrDefault();

            if (existingActivity == null)
            {
                return;
            }

            context.Remove(existingActivity);

            await context.SaveChangesAsync();
        }

        public async Task DeleteActivity(ActivityDto activity)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var existingActivity = context.Activities
                .Where(p => p.ActivityId == activity.ActivityId)
                .Include(p => p.Tags)
                .SingleOrDefault();

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