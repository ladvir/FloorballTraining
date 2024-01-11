using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TrainingConverter
{
    public static TrainingDto? ToDto(this Training? entity)
    {
        if (entity == null) return null;

        return new TrainingDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Place = entity.Place!.ToDto(),
            PersonsMin = entity.PersonsMin,
            PersonsMax = entity.PersonsMax,
            Difficulty = entity.Difficulty,
            Intensity = entity.Intensity,
            Duration = entity.Duration,
            CommentAfter = entity.CommentAfter,
            CommentBefore = entity.CommentBefore,
            TrainingParts = entity.TrainingParts != null ? entity.TrainingParts.Select(part => part.ToDto()!).ToList() : new List<TrainingPartDto>(),
            TrainingAgeGroups = entity.TrainingAgeGroups.Select(ageGroup => ageGroup.AgeGroup!.ToDto()!).ToList(),
            TrainingGoal = entity.TrainingGoal!.ToDto()
        };
    }
}