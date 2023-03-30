using TrainingDataAccess.Models;

namespace TrainingDataAccess.Dtos;

public static class TrainingDtoSelect
{
    public static IQueryable<TrainingDto>
        MapTrainingToDto(this IQueryable<Training> trainings)
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
                    TrainingGroupActivity = tg.TrainingGroupActivities.Select(tga =>

                        new TrainingGroupActivityDto
                        {
                            TrainingGroupActivityId = tga.TrainingGroupActivityId,
                            ActivityId = tga.ActivityId,
                            TrainingGroupId = tga.TrainingGroupId,

                            Activity = new ActivityDto
                            {
                                ActivityId = tga.Activity.ActivityId,
                                Name = tga.Activity.Name,
                                Description = tga.Activity.Description,
                                PersonsMax = tga.Activity.PersonsMax,
                                PersonsMin = tga.Activity.PersonsMin,
                                DurationMax = tga.Activity.DurationMax,
                                DurationMin = tga.Activity.DurationMin,
                                TagIds = tga.Activity.Tags.Select(tag => tag.TagId).ToList()
                            }
                        }
                        )
                        .ToList()
                }).ToList()
            }).ToList()
        });
    }
}