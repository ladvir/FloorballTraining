using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TrainingConverter
{
    public static TrainingDto ToDto(this Training entity)
    {
        ArgumentNullException.ThrowIfNull(entity);

        return new TrainingDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Environment = entity.Environment,
            PersonsMin = entity.PersonsMin,
            PersonsMax = entity.PersonsMax,
            GoaliesMin = entity.GoaliesMin,
            GoaliesMax = entity.GoaliesMax,

            Difficulty = entity.Difficulty,
            Intensity = entity.Intensity,
            Duration = entity.Duration,
            CommentAfter = entity.CommentAfter,
            CommentBefore = entity.CommentBefore,
            TrainingParts = entity.TrainingParts != null
                ? entity.TrainingParts.Select(part => part.ToDto()).ToList()
                : new List<TrainingPartDto>(),
            TrainingAgeGroups = entity.TrainingAgeGroups.Select(ageGroup => ageGroup.AgeGroup!.ToDto()).ToList(),
            TrainingGoal1 = entity.TrainingGoal1!.ToDto(),
            TrainingGoal2 = entity.TrainingGoal2!.ToDto(),
            TrainingGoal3 = entity.TrainingGoal3!.ToDto()
        };
    }
}