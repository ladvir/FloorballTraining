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
            Name = entity.Name,
            TrainingName = entity.Training?.Name,
            AppointmentType = entity.AppointmentType,
            Start = entity.Start,
            Duration = entity.Duration,
            TeamId = entity.TeamId
        };
    }
}