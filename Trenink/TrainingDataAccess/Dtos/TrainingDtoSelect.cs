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
                Duration = tp.Duration
            }).ToList()
        }
        );
    }
}