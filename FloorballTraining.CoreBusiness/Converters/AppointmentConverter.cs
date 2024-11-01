using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class AppointmentConverter
{
    public static AppointmentDto ToDto(this Appointment? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new AppointmentDto
        {
            Id = entity.Id,
            TrainingName = entity.Training?.Name,
            TrainingTargets = entity.Training?.GetTrainingGoalsNames(),
            AppointmentType = entity.AppointmentType,
            LocationId = entity.LocationId,
            LocationName = entity.Location?.Name,
            Start = entity.Start,
            End = entity.End,
            TeamId = entity.TeamId,
            RepeatingPattern = entity.RepeatingPattern.ToDto(),
            Name = entity.Name,
            Description = entity.Description
        };
    }

}