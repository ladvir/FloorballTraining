using TrainingDataAccess.Dtos;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Mappers;

public static class TrainingMapper
{
    public static IQueryable<TrainingDto> MapTrainingToDto(this IQueryable<Training> trainings)
    {
        return trainings.Select(t => new TrainingDto
        {
            TrainingId = t.TrainingId,
            Name = t.Name,
            Description = t.Description,
            Duration = t.Duration,
            Persons = t.Persons,
            TrainingParts = t.TrainingParts.Select(tp => new TrainingPartDto
            {
                TrainingId = tp.TrainingId,
                TrainingPartId = tp.TrainingPartId,
                Name = tp.Name,
                Description = tp.Description,
                Duration = tp.Duration,
                TrainingGroups = tp.TrainingGroups.Select(tg => new TrainingGroupDto
                {
                    TrainingGroupId = tg.TrainingGroupId,
                    Name = tg.Name,
                    TrainingGroupActivities = tg.TrainingGroupActivities.Select(tga =>

                        new TrainingGroupActivityDto
                        {
                            ActivityId = tga.ActivityId,
                            TrainingGroupId = tga.TrainingGroupId,
                            Activity = tga.Activity.MapToActivityDto()
                        }
                        )
                        .ToList()
                }).ToList()
            }).ToList()
        });
    }

    private static TagDto GetTag(Tag tag)
    {
        if (tag.ParentTagId == 0 || tag.ParentTag == null)
        {
            return new TagDto();
        }
        var t = new TagDto
        {
            TagId = tag.TagId,
            ParentTagId = tag.ParentTagId,
            Color = tag.Color,
            Name = tag.Name,
            ParentTag = tag.ParentTag != null ? GetTag(tag.ParentTag) : null
        };
        return t;
    }


    public static TrainingDto Clone(this TrainingDto original)
    {
        return new TrainingDto
        {
            Name = original.Name,
            Description = original.Description,
            Duration = original.Duration,
            Persons = original.Persons,
            TrainingParts = original.TrainingParts.Select(tp => new TrainingPartDto
            {
                Name = tp.Name,
                Description = tp.Description,
                Duration = tp.Duration,
                TrainingGroups = tp.TrainingGroups.Select(tg => new TrainingGroupDto
                {
                    Name = tg.Name,
                    TrainingGroupActivities = tg.TrainingGroupActivities.Select(tga =>

                            new TrainingGroupActivityDto
                            {
                                ActivityId = tga.ActivityId,
                                TrainingGroupId = tga.TrainingGroupId,
                                Activity = tga.Activity
                            }
                        )
                        .ToList()
                }).ToList()
            }).ToList()
        };
    }
}