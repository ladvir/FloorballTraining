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
                ? entity.TrainingParts.OrderBy(p => p.Order).Select(part => part.ToDto()).ToList()
                : new List<TrainingPartDto>(),
            TrainingAgeGroups = entity.TrainingAgeGroups.Select(ageGroup => ageGroup.AgeGroup!.ToDto()).ToList(),
            TrainingTags = entity.TrainingTags.Select(tt => tt.ToDto()!).ToList(),
            NoSpecificGoal = entity.NoSpecificGoal,
            TrainingGoalSkill1 = entity.TrainingGoalSkill1?.ToDto(),
            TrainingGoalSkill2 = entity.TrainingGoalSkill2?.ToDto(),
            TrainingGoalSkill3 = entity.TrainingGoalSkill3?.ToDto(),
            IsDraft = entity.IsDraft,
            IsIndividual = entity.IsIndividual,
            CreatedByUserId = entity.CreatedByUserId,
            ActivitySignature = entity.ActivitySignature
        };
    }
}