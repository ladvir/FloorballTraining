using TrainingDataAccess.Dtos;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Mappers;

public static class ActivityTagMapper
{
    public static IQueryable<ActivityTagDto> MapToActivityTagDto(this IQueryable<ActivityTag> activityTags)
    {
        return activityTags.Select(a => MapToActivityTagDto(a));
    }

    public static ActivityTagDto MapToActivityTagDto(this ActivityTag tag)
    {
        var activityTagDto = new ActivityTagDto
        {
            TagId = tag.TagId,
            ActivityId = tag.ActivityId,
            Tag = tag.Tag.MapToTagDto(),
            //Pokud odkomentujes dojde k zacykleni Activity = tag.Activity.MapToActivityDto() 
        };


        return activityTagDto;
    }
}