using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.Services;

public interface IAppointmentService
{
    void GenerateFutureAppointments(RepeatingPatternDto repeatingPattern, AppointmentDto template);
    void UpdatePattern(RepeatingPatternDto repeatingPattern, AppointmentDto template, RepeatingFrequency repeatingFrequency, int interval, DateTime? endDate = null);
}