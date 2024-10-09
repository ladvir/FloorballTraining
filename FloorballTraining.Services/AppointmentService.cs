using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;


namespace FloorballTraining.Services
{
    public class AppointmentService : IAppointmentService
    {
        public void GenerateFutureAppointments(AppointmentDto appointment,
            RepeatingFrequency repeatingFrequency, int interval, DateTime? repeatingEnd,
            bool updateAllFutureAppointments)
        {
            if (repeatingFrequency == RepeatingFrequency.Once)
            {
                appointment.RepeatingPattern = null;
                return;
            }

            var repeatingPattern = appointment.RepeatingPattern ?? new RepeatingPatternDto();

            repeatingPattern.EndDate ??= repeatingEnd;
            repeatingPattern.StartDate = appointment.Start;
            repeatingPattern.RepeatingFrequency = repeatingFrequency;
            repeatingPattern.Interval = interval;
            repeatingPattern.InitialAppointment = appointment;

            appointment.RepeatingPattern = repeatingPattern;

            //remove all future ones and recreate them again
            appointment.FutureAppointments.RemoveAll(f => !f.IsPast);

            if (appointment.ParentAppointment != null)
            {
                UpdatePattern(repeatingPattern, appointment.ParentAppointment, repeatingFrequency, interval, repeatingEnd);
            }
            else
            {
                UpdatePattern(repeatingPattern, appointment, repeatingFrequency, interval, repeatingEnd);
            }
        }

        public void GenerateFutureAppointments(RepeatingPatternDto repeatingPattern, AppointmentDto template)
        {
            if (repeatingPattern.RepeatingFrequency == RepeatingFrequency.Once) return;

            var currentDate = GetNextDate(repeatingPattern, template.Start);

            while (repeatingPattern.EndDate == null || currentDate <= repeatingPattern.EndDate.Value.AddSeconds(-1))
            {
                var newAppointment = new AppointmentDto
                {
                    RepeatingPattern = repeatingPattern,
                    Start = currentDate,
                    End = currentDate.Add(template.End - template.Start),
                    AppointmentType = template.AppointmentType,
                    LocationId = template.LocationId,
                    LocationName = template.LocationName,
                    TrainingName = template.TrainingName,
                    TeamId = template.TeamId,
                    TrainingId = template.TrainingId,
                    ParentAppointment = template,
                    Description = template.Description,
                    Name = template.Name
                };

                repeatingPattern.FutureAppointments.Add(newAppointment);
                template.FutureAppointments.Add(newAppointment);

                // Move to the next appointment date
                currentDate = GetNextDate(repeatingPattern, currentDate);
            }
        }

        private DateTime GetNextDate(RepeatingPatternDto repeatingPattern, DateTime currentDate)
        {
            return repeatingPattern.RepeatingFrequency switch
            {
                RepeatingFrequency.Daily => currentDate.AddDays(repeatingPattern.Interval),
                RepeatingFrequency.Weekly => currentDate.AddDays(7 * repeatingPattern.Interval),
                RepeatingFrequency.Monthly => currentDate.AddMonths(repeatingPattern.Interval),
                RepeatingFrequency.Once => repeatingPattern.EndDate.GetValueOrDefault(),
                RepeatingFrequency.Yearly => currentDate.AddYears(repeatingPattern.Interval),
                _ => currentDate
            };
        }

        public void UpdatePattern(RepeatingPatternDto repeatingPattern, AppointmentDto template, RepeatingFrequency repeatingFrequency, int interval, DateTime? endDate = null)
        {
            repeatingPattern.RepeatingFrequency = repeatingFrequency;
            repeatingPattern.Interval = interval;
            repeatingPattern.EndDate = endDate;

            // Regenerate future appointments based on the updated pattern
            GenerateFutureAppointments(repeatingPattern, template);
        }
    }
}
