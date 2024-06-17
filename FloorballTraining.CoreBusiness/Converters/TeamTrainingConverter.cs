using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class TeamTrainingConverter
{
    public static TeamTrainingDto ToDto(this TeamTraining entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new TeamTrainingDto
        {
            Id = entity.Id,
            Team = entity.Team!.ToDto()!,
            TeamId = entity.TeamId,
            Training = entity.Training!.ToDto(),
            TrainingId = entity.TrainingId
        };
    }
}
