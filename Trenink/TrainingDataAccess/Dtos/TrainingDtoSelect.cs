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
                    Name = tg.Name,
                    Activities = tg.Activities.Select(
                        a => new ActivityDto
                        {
                            Description = a.Description,
                            Name = a.Name,
                            ActivityId = a.ActivityId,
                            PersonsMax = a.PersonsMax,
                            PersonsMin = a.PersonsMin,
                            DurationMax = a.DurationMax,
                            DurationMin = a.DurationMin,
                            TagIds = a.Tags.Select(tag => tag.TagId).ToList()
                        }).ToList()
                }).ToList()
            }).ToList()
        });
    }
}